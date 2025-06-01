<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disposition extends Model
{
    protected $table = 'Dispostion'; // Match your actual table name (with the typo)
    
    protected $fillable = [
        'Dispostion', // Match your actual column name
        'Svg'
    ];
    
    public $timestamps = false; // Since you didn't add timestamps in migration
}