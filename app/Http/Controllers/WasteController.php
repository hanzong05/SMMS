<?php

namespace App\Http\Controllers;

use App\Models\Waste;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class WasteController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            Log::info('WasteController: Fetching all wastes');
            $wastes = Waste::all();
            Log::info('WasteController: Successfully fetched wastes', ['count' => $wastes->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $wastes
            ]);
        } catch (\Exception $e) {
            Log::error('WasteController: Failed to fetch wastes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch wastes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        Log::info('WasteController: Store method called');
        Log::info('WasteController: Request data', $request->all());
        
        try {
            // Handle both single item and bulk items
            if ($request->has('items') && is_array($request->items)) {
                Log::info('WasteController: Processing bulk items', ['item_count' => count($request->items)]);
                
                // Bulk creation
                $validatedItems = [];
                
                foreach ($request->items as $index => $item) {
                    Log::info("WasteController: Processing item {$index}", $item);
                    
                    // Create validator instance
                    $validator = Validator::make($item, [
                        'TypeOfWaste' => 'required|string|max:255',
                        'Disposition' => 'required|string|max:255',
                        'Weight' => 'required|numeric|min:0',
                        'Unit' => 'required|string|max:50',
                        'InputBy' => 'required|string|max:100',
                        // Don't require VerifiedBy since it's set to null in frontend
                    ]);

                    if ($validator->fails()) {
                        Log::error("WasteController: Validation failed for item {$index}", [
                            'errors' => $validator->errors()->toArray(),
                            'item_data' => $item
                        ]);
                        
                        return response()->json([
                            'success' => false,
                            'message' => 'Validation failed for item ' . ($index + 1),
                            'errors' => $validator->errors()
                        ], 422);
                    }

                    $validated = $validator->validated();
                    Log::info("WasteController: Item {$index} validation passed", $validated);
                    
                    // Add Verifiedby as null if not provided
                    $validated['Verifiedby'] = $item['VerifiedBy'] ?? null;
                    Log::info("WasteController: Item {$index} after adding VerifiedBy", $validated);
                    
                    $validatedItems[] = $validated;
                }
                
                Log::info('WasteController: All items validated, creating records');
                
                // Create all items
                $createdWastes = [];
                foreach ($validatedItems as $index => $validatedItem) {
                    try {
                        Log::info("WasteController: Creating waste record {$index}", $validatedItem);
                        $waste = Waste::create($validatedItem);
                        Log::info("WasteController: Successfully created waste record {$index}", ['id' => $waste->id]);
                        $createdWastes[] = $waste;
                    } catch (\Exception $e) {
                        Log::error("WasteController: Failed to create waste record {$index}", [
                            'error' => $e->getMessage(),
                            'data' => $validatedItem,
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw $e; // Re-throw to be caught by outer try-catch
                    }
                }
                
                Log::info('WasteController: All waste records created successfully', ['count' => count($createdWastes)]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Waste items created successfully',
                    'data' => $createdWastes
                ], 201);
                
            } else {
                Log::info('WasteController: Processing single item');
                
                // Single item creation
                $validated = $request->validate([
                    'TypeOfWaste' => 'required|string|max:255',
                    'Disposition' => 'required|string|max:255',
                    'Weight' => 'required|numeric|min:0',
                    'Unit' => 'required|string|max:50',
                    'InputBy' => 'required|string|max:100',
                ]);

                Log::info('WasteController: Single item validation passed', $validated);

                // Add Verifiedby as null
                $validated['Verifiedby'] = $request->input('VerifiedBy', null);
                Log::info('WasteController: Single item after adding VerifiedBy', $validated);

                $waste = Waste::create($validated);
                Log::info('WasteController: Single waste record created', ['id' => $waste->id]);

                return response()->json([
                    'success' => true,
                    'message' => 'Waste item created successfully',
                    'data' => $waste
                ], 201);
            }
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('WasteController: Validation exception', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('WasteController: General exception in store method', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create waste item(s)',
                'error' => $e->getMessage(),
                'debug_info' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            Log::info('WasteController: Fetching waste by ID', ['id' => $id]);
            $waste = Waste::findOrFail($id);
            Log::info('WasteController: Successfully fetched waste', ['waste' => $waste->toArray()]);
            
            return response()->json([
                'success' => true,
                'data' => $waste
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('WasteController: Waste not found', ['id' => $id]);
            
            return response()->json([
                'success' => false,
                'message' => 'Waste item not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('WasteController: Failed to fetch waste', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch waste item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            Log::info('WasteController: Updating waste', ['id' => $id, 'data' => $request->all()]);
            
            $waste = Waste::findOrFail($id);
            
            $validated = $request->validate([
                'TypeOfWaste' => 'required|string|max:255',
                'Disposition' => 'required|string|max:255',
                'Weight' => 'required|numeric|min:0',
                'Unit' => 'required|string|max:50',
                'InputBy' => 'required|string|max:100',
            ]);

            // Add Verifiedby
            $validated['Verifiedby'] = $request->input('VerifiedBy', null);
            Log::info('WasteController: Update validation passed', $validated);

            $waste->update($validated);
            Log::info('WasteController: Waste updated successfully', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Waste item updated successfully',
                'data' => $waste
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('WasteController: Waste not found for update', ['id' => $id]);
            
            return response()->json([
                'success' => false,
                'message' => 'Waste item not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('WasteController: Update validation failed', [
                'id' => $id,
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('WasteController: Failed to update waste', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update waste item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            Log::info('WasteController: Deleting waste', ['id' => $id]);
            
            $waste = Waste::findOrFail($id);
            $waste->delete();
            
            Log::info('WasteController: Waste deleted successfully', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Waste item deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::warning('WasteController: Waste not found for deletion', ['id' => $id]);
            
            return response()->json([
                'success' => false,
                'message' => 'Waste item not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('WasteController: Failed to delete waste', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete waste item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}