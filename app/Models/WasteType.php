<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WasteType extends Model
{
    protected $table = 'WasteTypes'; // Match your actual table name (plural)
    
    protected $fillable = [
        'WasteType', // This matches
        'Svg'
    ];
    
    public $timestamps = false; // Since you didn't add timestamps in migration
}