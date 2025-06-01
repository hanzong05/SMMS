<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WasteType;
use App\Models\Disposition;
use Illuminate\Http\JsonResponse;

class WasteConfigController extends Controller
{
    // Waste Types Methods
    public function getWasteTypes(): JsonResponse
    {
        try {
            $wasteTypes = WasteType::all();
            return response()->json([
                'success' => true,
                'data' => $wasteTypes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch waste types',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeWasteType(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'WasteType' => 'required|string|max:255|unique:WasteTypes,WasteType', // Fixed table name
                'Svg' => 'required|string|max:10'
            ]);

            $wasteType = WasteType::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Waste type created successfully',
                'data' => $wasteType
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create waste type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateWasteType(Request $request, $id): JsonResponse
    {
        try {
            $wasteType = WasteType::findOrFail($id);
            
            $validated = $request->validate([
                'WasteType' => 'required|string|max:255|unique:WasteTypes,WasteType,' . $id, // Fixed table name
                'Svg' => 'required|string|max:10'
            ]);

            $wasteType->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Waste type updated successfully',
                'data' => $wasteType
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Waste type not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update waste type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteWasteType($id): JsonResponse
    {
        try {
            $wasteType = WasteType::findOrFail($id);
            $wasteType->delete();

            return response()->json([
                'success' => true,
                'message' => 'Waste type deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Waste type not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete waste type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Dispositions Methods
    public function getDispositions(): JsonResponse
    {
        try {
            $dispositions = Disposition::all();
            return response()->json([
                'success' => true,
                'data' => $dispositions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dispositions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeDisposition(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'Dispostion' => 'required|string|max:255|unique:Dispostion,Dispostion', // Fixed field and table name
                'Svg' => 'required|string|max:10'
            ]);

            $disposition = Disposition::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Disposition created successfully',
                'data' => $disposition
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create disposition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateDisposition(Request $request, $id): JsonResponse
    {
        try {
            $disposition = Disposition::findOrFail($id);
            
            $validated = $request->validate([
                'Dispostion' => 'required|string|max:255|unique:Dispostion,Dispostion,' . $id, // Fixed field and table name
                'Svg' => 'required|string|max:10'
            ]);

            $disposition->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Disposition updated successfully',
                'data' => $disposition
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Disposition not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update disposition',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteDisposition($id): JsonResponse
    {
        try {
            $disposition = Disposition::findOrFail($id);
            $disposition->delete();

            return response()->json([
                'success' => true,
                'message' => 'Disposition deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Disposition not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete disposition',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}