<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Waste extends Model
{
    use HasFactory;
    
    protected $table = 'wastes';

    protected $fillable = [
        'TypeOfWaste',
        'Disposition', 
        'Weight',
        'Unit',
        'InputBy',
        'VerifiedBy'  // Make sure this matches your database column name exactly
    ];

    protected $casts = [
        'Weight' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Optional: Add relationships if you have them
    // public function wasteType()
    // {
    //     return $this->belongsTo(WasteType::class, 'TypeOfWaste', 'WasteType');
    // }

    // public function disposition()
    // {
    //     return $this->belongsTo(Disposition::class, 'Disposition', 'Dispostion');
    // }
}