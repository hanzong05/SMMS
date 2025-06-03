# app.py - Flask ML Analytics API
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import mysql.connector
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

class WasteMLAnalytics:
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.models = {}
        self.load_models()
    
    def connect_to_database(self):
        """Connect to your Laravel MySQL database"""
        try:
            connection = mysql.connector.connect(
               host='127.0.0.1',  # Update with your actual DB host
            database='SMMS',  # Update from 'your_waste_db' to your actual database name
            user='root',  # Update from 'your_username' to your actual DB username
            password=''  # Update with your DB password
            )
            return connection
        except Exception as e:
            print(f"Database connection error: {e}")
            return None
    
    def fetch_real_time_data(self):
        """Fetch real-time data from your Laravel database"""
        connection = self.connect_to_database()
        if not connection:
            return None
        
        try:
            query = """
            SELECT id, type_of_waste AS TypeOfWaste, disposition AS Disposition, 
               weight AS Weight, unit AS Unit, input_by AS InputBy, 
               verified_by AS VerifiedBy, created_at, updated_at 
        FROM wastes 
        ORDER BY created_at DESC
            """
            df = pd.read_sql(query, connection)
            connection.close()
            return df
        except Exception as e:
            print(f"Data fetch error: {e}")
            return None
    
    def convert_to_kg(self, weight, unit):
        """Convert weights to standard kg unit"""
        weight = float(weight) if weight else 0
        unit = str(unit).lower() if unit else 'kg'
        
        conversion_factors = {
            'lbs': 0.453592, 'lb': 0.453592,
            'tons': 1000, 'ton': 1000,
            'g': 0.001, 'grams': 0.001,
            'kg': 1, 'kilograms': 1
        }
        return weight * conversion_factors.get(unit, 1)
    
    def preprocess_data(self, df):
        """Preprocess data for ML models"""
        if df is None or df.empty:
            return None
        
        # Convert weights to kg
        df['weight_kg'] = df.apply(lambda row: self.convert_to_kg(row['Weight'], row['Unit']), axis=1)
        
        # Extract date features
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['date'] = df['created_at'].dt.date
        df['hour'] = df['created_at'].dt.hour
        df['day_of_week'] = df['created_at'].dt.dayofweek
        df['month'] = df['created_at'].dt.month
        df['quarter'] = df['created_at'].dt.quarter
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        # Encode categorical variables
        categorical_columns = ['TypeOfWaste', 'Disposition', 'InputBy']
        for col in categorical_columns:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].fillna('Unknown'))
            else:
                # Handle new categories
                try:
                    df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col].fillna('Unknown'))
                except ValueError:
                    # Add new categories to encoder
                    unique_values = list(self.label_encoders[col].classes_) + list(df[col].unique())
                    self.label_encoders[col].classes_ = np.array(list(set(unique_values)))
                    df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col].fillna('Unknown'))
        
        return df
    
    def time_series_prediction(self, df, days_ahead=7):
        """Predict waste generation for next N days"""
        if df is None or df.empty:
            return []
        
        # Create daily aggregations
        daily_data = df.groupby('date').agg({
            'weight_kg': 'sum',
            'id': 'count'
        }).reset_index()
        daily_data.columns = ['date', 'total_weight', 'item_count']
        daily_data = daily_data.sort_values('date')
        
        if len(daily_data) < 14:  # Need minimum data
            return []
        
        # Create features for time series
        daily_data['day_of_week'] = pd.to_datetime(daily_data['date']).dt.dayofweek
        daily_data['month'] = pd.to_datetime(daily_data['date']).dt.month
        daily_data['days_since_start'] = (daily_data['date'] - daily_data['date'].min()).dt.days
        
        # Create lagged features
        for lag in [1, 3, 7]:
            daily_data[f'weight_lag_{lag}'] = daily_data['total_weight'].shift(lag)
            daily_data[f'count_lag_{lag}'] = daily_data['item_count'].shift(lag)
        
        # Moving averages
        daily_data['weight_ma_3'] = daily_data['total_weight'].rolling(3).mean()
        daily_data['weight_ma_7'] = daily_data['total_weight'].rolling(7).mean()
        
        # Remove rows with NaN values
        daily_data = daily_data.dropna()
        
        if len(daily_data) < 7:
            return []
        
        # Prepare features and target
        feature_cols = ['day_of_week', 'month', 'days_since_start', 
                       'weight_lag_1', 'weight_lag_3', 'weight_lag_7',
                       'count_lag_1', 'count_lag_3', 'count_lag_7',
                       'weight_ma_3', 'weight_ma_7']
        
        X = daily_data[feature_cols]
        y_weight = daily_data['total_weight']
        y_count = daily_data['item_count']
        
        # Train models
        rf_weight = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_count = RandomForestRegressor(n_estimators=100, random_state=42)
        
        rf_weight.fit(X, y_weight)
        rf_count.fit(X, y_count)
        
        # Make predictions
        predictions = []
        last_date = daily_data['date'].max()
        
        for i in range(1, days_ahead + 1):
            pred_date = last_date + timedelta(days=i)
            
            # Create features for prediction
            pred_features = {
                'day_of_week': pred_date.weekday(),
                'month': pred_date.month,
                'days_since_start': (pred_date - daily_data['date'].min()).days,
                'weight_lag_1': daily_data['total_weight'].iloc[-1] if i == 1 else predictions[-1]['predicted_weight'],
                'weight_lag_3': daily_data['total_weight'].iloc[-3] if i <= 3 else predictions[-3]['predicted_weight'],
                'weight_lag_7': daily_data['total_weight'].iloc[-7] if i <= 7 else predictions[-7]['predicted_weight'],
                'count_lag_1': daily_data['item_count'].iloc[-1] if i == 1 else predictions[-1]['predicted_count'],
                'count_lag_3': daily_data['item_count'].iloc[-3] if i <= 3 else predictions[-3]['predicted_count'],
                'count_lag_7': daily_data['item_count'].iloc[-7] if i <= 7 else predictions[-7]['predicted_count'],
                'weight_ma_3': daily_data['weight_ma_3'].iloc[-1],
                'weight_ma_7': daily_data['weight_ma_7'].iloc[-1]
            }
            
            X_pred = np.array([[pred_features[col] for col in feature_cols]])
            
            pred_weight = max(0, rf_weight.predict(X_pred)[0])
            pred_count = max(0, int(rf_count.predict(X_pred)[0]))
            
            predictions.append({
                'date': pred_date.strftime('%Y-%m-%d'),
                'predicted_weight': round(pred_weight, 2),
                'predicted_count': pred_count
            })
        
        return predictions
    
    def anomaly_detection(self, df):
        """Detect anomalies in waste data"""
        if df is None or df.empty:
            return []
        
        # Features for anomaly detection
        features = ['weight_kg', 'hour', 'day_of_week', 'month']
        
        # Add encoded categorical features
        for col in ['TypeOfWaste', 'Disposition']:
            if f'{col}_encoded' in df.columns:
                features.append(f'{col}_encoded')
        
        X = df[features].fillna(0)
        
        # Isolation Forest for anomaly detection
        iso_forest = IsolationForest(contamination=0.1, random_state=42)
        anomalies = iso_forest.fit_predict(X)
        
        # Get anomalous records
        anomaly_data = df[anomalies == -1].copy()
        anomaly_data['anomaly_score'] = iso_forest.decision_function(X)[anomalies == -1]
        
        # Sort by most anomalous
        anomaly_data = anomaly_data.sort_values('anomaly_score')
        
        results = []
        for _, row in anomaly_data.head(20).iterrows():
            results.append({
                'id': int(row['id']),
                'date': row['created_at'].strftime('%Y-%m-%d %H:%M'),
                'waste_type': row['TypeOfWaste'],
                'weight_kg': round(row['weight_kg'], 2),
                'disposition': row['Disposition'],
                'user': row['InputBy'],
                'anomaly_score': round(row['anomaly_score'], 3),
                'reason': self.get_anomaly_reason(row)
            })
        
        return results
    
    def get_anomaly_reason(self, row):
        """Determine reason for anomaly"""
        reasons = []
        
        # Check for unusual weight
        if row['weight_kg'] > 100:
            reasons.append("Unusually high weight")
        elif row['weight_kg'] < 0.1:
            reasons.append("Unusually low weight")
        
        # Check for unusual time
        if row['hour'] < 6 or row['hour'] > 22:
            reasons.append("Unusual processing time")
        
        return "; ".join(reasons) if reasons else "Statistical outlier"
    
    def waste_clustering(self, df):
        """Cluster waste patterns"""
        if df is None or df.empty:
            return {}
        
        # Features for clustering
        daily_stats = df.groupby(['date', 'TypeOfWaste']).agg({
            'weight_kg': 'sum',
            'id': 'count'
        }).reset_index()
        
        # Pivot to get waste types as features
        pivot_data = daily_stats.pivot_table(
            index='date', 
            columns='TypeOfWaste', 
            values='weight_kg', 
            fill_value=0
        )
        
        if pivot_data.empty:
            return {}
        
        # Standardize data
        X_scaled = self.scaler.fit_transform(pivot_data)
        
        # K-means clustering
        kmeans = KMeans(n_clusters=min(5, len(pivot_data)), random_state=42)
        clusters = kmeans.fit_predict(X_scaled)
        
        # Analyze clusters
        cluster_analysis = {}
        for i in range(max(clusters) + 1):
            cluster_dates = pivot_data.index[clusters == i]
            cluster_data = pivot_data.iloc[clusters == i]
            
            cluster_analysis[f'cluster_{i}'] = {
                'size': len(cluster_dates),
                'avg_total_weight': round(cluster_data.sum(axis=1).mean(), 2),
                'dominant_waste_type': cluster_data.mean().idxmax(),
                'pattern_description': self.describe_cluster_pattern(cluster_data)
            }
        
        return cluster_analysis
    
    def describe_cluster_pattern(self, cluster_data):
        """Describe the pattern of a cluster"""
        avg_weights = cluster_data.mean()
        top_waste = avg_weights.nlargest(2)
        
        if len(top_waste) >= 2:
            return f"High {top_waste.index[0]} ({top_waste.iloc[0]:.1f}kg) and {top_waste.index[1]} ({top_waste.iloc[1]:.1f}kg)"
        else:
            return f"Primarily {top_waste.index[0]} ({top_waste.iloc[0]:.1f}kg)"
    
    def seasonal_analysis(self, df):
        """Analyze seasonal patterns"""
        if df is None or df.empty:
            return {}
        
        monthly_data = df.groupby('month').agg({
            'weight_kg': 'sum',
            'id': 'count'
        }).reset_index()
        
        quarterly_data = df.groupby('quarter').agg({
            'weight_kg': 'sum',
            'id': 'count'
        }).reset_index()
        
        weekly_data = df.groupby('day_of_week').agg({
            'weight_kg': 'sum',
            'id': 'count'
        }).reset_index()
        
        return {
            'monthly_patterns': monthly_data.to_dict('records'),
            'quarterly_patterns': quarterly_data.to_dict('records'),
            'weekly_patterns': weekly_data.to_dict('records'),
            'peak_month': int(monthly_data.loc[monthly_data['weight_kg'].idxmax(), 'month']),
            'peak_quarter': int(quarterly_data.loc[quarterly_data['weight_kg'].idxmax(), 'quarter']),
            'peak_day': int(weekly_data.loc[weekly_data['weight_kg'].idxmax(), 'day_of_week'])
        }
    
    def optimization_recommendations(self, df):
        """Generate optimization recommendations"""
        if df is None or df.empty:
            return {}
        
        recommendations = []
        
        # Analyze recycling efficiency
        if 'Disposition' in df.columns:
            disposition_stats = df.groupby('Disposition')['weight_kg'].sum()
            total_weight = disposition_stats.sum()
            
            recycled_weight = disposition_stats.get('Recycled', 0) + disposition_stats.get('Composted', 0)
            recycling_rate = (recycled_weight / total_weight * 100) if total_weight > 0 else 0
            
            if recycling_rate < 50:
                recommendations.append({
                    'type': 'recycling',
                    'priority': 'high',
                    'message': f'Current recycling rate is {recycling_rate:.1f}%. Consider increasing recycling efforts.',
                    'potential_impact': f'Could divert {(total_weight * 0.5 - recycled_weight):.1f}kg from landfill'
                })
        
        # Analyze user efficiency
        user_efficiency = df.groupby('InputBy').agg({
            'weight_kg': 'mean',
            'id': 'count'
        }).reset_index()
        
        if len(user_efficiency) > 1:
            avg_weight_per_entry = user_efficiency['weight_kg'].mean()
            inefficient_users = user_efficiency[user_efficiency['weight_kg'] < avg_weight_per_entry * 0.7]
            
            if len(inefficient_users) > 0:
                recommendations.append({
                    'type': 'training',
                    'priority': 'medium',
                    'message': f'{len(inefficient_users)} users show lower efficiency. Consider additional training.',
                    'potential_impact': 'Improved data quality and processing efficiency'
                })
        
        # Time-based recommendations
        hourly_data = df.groupby('hour')['id'].count()
        peak_hours = hourly_data.nlargest(3).index.tolist()
        
        recommendations.append({
            'type': 'scheduling',
            'priority': 'medium',
            'message': f'Peak processing hours: {", ".join(map(str, peak_hours))}. Consider load balancing.',
            'potential_impact': 'Better resource allocation and reduced processing delays'
        })
        
        return {
            'recommendations': recommendations,
            'recycling_rate': recycling_rate if 'recycling_rate' in locals() else 0,
            'total_processed': total_weight if 'total_weight' in locals() else 0
        }
    
    def load_models(self):
        """Load pre-trained models if they exist"""
        try:
            self.models['scaler'] = joblib.load('models/scaler.joblib')
            self.models['predictor'] = joblib.load('models/predictor.joblib')
        except:
            print("No pre-trained models found. Will train new models.")
    
    def save_models(self):
        """Save trained models"""
        import os
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.scaler, 'models/scaler.joblib')
        if 'predictor' in self.models:
            joblib.dump(self.models['predictor'], 'models/predictor.joblib')

# Initialize ML Analytics
ml_analytics = WasteMLAnalytics()

@app.route('/api/ml/analytics', methods=['GET'])
def get_ml_analytics():
    """Main endpoint for ML analytics"""
    try:
        # Fetch real-time data
        df = ml_analytics.fetch_real_time_data()
        
        if df is None or df.empty:
            return jsonify({
                'success': False,
                'message': 'No data available',
                'data': {}
            })
        
        # Preprocess data
        df = ml_analytics.preprocess_data(df)
        
        # Perform ML analysis
        predictions = ml_analytics.time_series_prediction(df)
        anomalies = ml_analytics.anomaly_detection(df)
        clusters = ml_analytics.waste_clustering(df)
        seasonal = ml_analytics.seasonal_analysis(df)
        optimization = ml_analytics.optimization_recommendations(df)
        
        return jsonify({
            'success': True,
            'data': {
                'predictions': predictions,
                'anomalies': anomalies,
                'clusters': clusters,
                'seasonal_analysis': seasonal,
                'optimization': optimization,
                'data_stats': {
                    'total_records': len(df),
                    'date_range': {
                        'start': df['created_at'].min().strftime('%Y-%m-%d'),
                        'end': df['created_at'].max().strftime('%Y-%m-%d')
                    },
                    'total_weight_kg': round(df['weight_kg'].sum(), 2)
                }
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error in ML analysis: {str(e)}',
            'data': {}
        }), 500

@app.route('/api/ml/predictions', methods=['GET'])
def get_predictions():
    """Get waste predictions"""
    try:
        days_ahead = int(request.args.get('days', 7))
        df = ml_analytics.fetch_real_time_data()
        
        if df is None:
            return jsonify({'success': False, 'predictions': []})
        
        df = ml_analytics.preprocess_data(df)
        predictions = ml_analytics.time_series_prediction(df, days_ahead)
        
        return jsonify({
            'success': True,
            'predictions': predictions
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
            'predictions': []
        }), 500

@app.route('/api/ml/anomalies', methods=['GET'])
def get_anomalies():
    """Get anomaly detection results"""
    try:
        df = ml_analytics.fetch_real_time_data()
        
        if df is None:
            return jsonify({'success': False, 'anomalies': []})
        
        df = ml_analytics.preprocess_data(df)
        anomalies = ml_analytics.anomaly_detection(df)
        
        return jsonify({
            'success': True,
            'anomalies': anomalies
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
            'anomalies': []
        }), 500
@app.route('/predict', methods=['GET'])
def predict():
    analytics = WasteMLAnalytics()
    df = analytics.fetch_real_time_data()
    df = analytics.preprocess_data(df)
    prediction = analytics.time_series_prediction(df)
    return jsonify(prediction)

@app.route('/anomalies', methods=['GET'])
def anomalies():
    analytics = WasteMLAnalytics()
    df = analytics.fetch_real_time_data()
    df = analytics.preprocess_data(df)
    results = analytics.anomaly_detection(df)
    return jsonify(results)

@app.route('/recommendations', methods=['GET'])
def recommendations():
    analytics = WasteMLAnalytics()
    df = analytics.fetch_real_time_data()
    df = analytics.preprocess_data(df)
    results = analytics.optimization_recommendations(df)
    return jsonify(results)

# etc.

@app.route('/api/ml/retrain', methods=['POST'])
def retrain_models():
    """Retrain ML models with latest data"""
    try:
        df = ml_analytics.fetch_real_time_data()
        
        if df is None:
            return jsonify({'success': False, 'message': 'No data available for training'})
        
        df = ml_analytics.preprocess_data(df)
        
        # Retrain models (simplified version)
        # In production, you'd want more sophisticated retraining logic
        ml_analytics.save_models()
        
        return jsonify({
            'success': True,
            'message': 'Models retrained successfully',
            'training_data_size': len(df)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Retraining failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)