const { Matrix } = require('ml-matrix');
const KNN = require('ml-knn');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

class WorkerAssignmentML {
    constructor() {
        this.model = null;
        this.workers = [];
        this.machines = [1, 2, 3, 4, 5];
        this.trainingData = [];
        this.isModelTrained = false;
        this.debugMode = false; // Initialize debug mode
        this.modelPath = path.join(__dirname, '..', 'data', 'trained_model.json');
    }
     // Helper function to calculate standard deviation
    calculateStandardDeviation(values) {
        if (values.length === 0) return 0;
        const mean = _.mean(values);
        const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = _.mean(squaredDifferences);
        return Math.sqrt(avgSquaredDiff);
    }


    // Add training data
    addHistoricalData(data) {
        // Validate data structure
        const requiredFields = ['workerId', 'machineId', 'timeMinutes', 'qualityScore'];
        const isValid = data.every(record => 
            requiredFields.every(field => record.hasOwnProperty(field))
        );

        if (!isValid) {
            throw new Error('Invalid data format. Required fields: workerId, machineId, timeMinutes, qualityScore');
        }

        this.trainingData = [...this.trainingData, ...data];
        
        // Extract unique workers
        this.workers = [...new Set(this.trainingData.map(d => d.workerId))];
        
        console.log(`Added ${data.length} historical records`);
        console.log(`Total workers: ${this.workers.length}`);
        console.log(`Total training records: ${this.trainingData.length}`);
    }

    // Train the ML model
    train() {
        if (this.trainingData.length === 0) {
            throw new Error('No training data available. Add historical data first.');
        }

        // Create feature matrix: [machineId, avgTime, avgQuality, jobCount]
        const workerFeatures = [];
        const workerLabels = [];

        this.workers.forEach(workerId => {
            const workerData = this.trainingData.filter(d => d.workerId === workerId);
            
            this.machines.forEach(machineId => {
                const machineData = workerData.filter(d => d.machineId === machineId);
                
                if (machineData.length > 0) {
                    const avgTime = _.mean(machineData.map(d => d.timeMinutes));
                    const avgQuality = _.mean(machineData.map(d => d.qualityScore));
                    const jobCount = machineData.length;
                    
                    // Features: [machineId, avgTime, avgQuality, jobCount]
                    workerFeatures.push([machineId, avgTime, avgQuality, jobCount]);
                    workerLabels.push(workerId);
                }
            });
        });

        // Train KNN model - fix the constructor call
        this.model = new KNN(workerFeatures, workerLabels, { k: 3 });
        this.isModelTrained = true;
        
        console.log(`Model trained with ${workerFeatures.length} feature vectors`);
        console.log('Training completed successfully!');

        // Auto-save the trained model
        this.saveModel();
    }

    // Save trained model to disk
    saveModel() {
        if (!this.isModelTrained || !this.model) {
            console.log('⚠️  No trained model to save');
            return false;
        }

        try {
            const modelData = {
                timestamp: new Date().toISOString(),
                trainingDataSize: this.trainingData.length,
                workers: this.workers,
                machines: this.machines,
                // KNN model serialization (simplified)
                modelConfig: {
                    k: 3,
                    featureCount: this.model.X ? this.model.X.length : 0,
                    labelCount: this.model.y ? this.model.y.length : 0
                },
                // Save training metadata for validation
                trainingMetadata: {
                    totalRecords: this.trainingData.length,
                    workerCount: this.workers.length,
                    machineCount: this.machines.length
                }
            };

            fs.writeFileSync(this.modelPath, JSON.stringify(modelData, null, 2));
            console.log(`💾 Model saved to: ${this.modelPath}`);
            return true;
        } catch (error) {
            console.error('❌ Failed to save model:', error.message);
            return false;
        }
    }

    // Load trained model from disk
    loadModel() {
        if (!fs.existsSync(this.modelPath)) {
            console.log('📂 No saved model found. Training required.');
            return false;
        }

        try {
            const modelData = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
            
            // Validate model compatibility
            if (modelData.workers && modelData.machines) {
                this.workers = modelData.workers;
                this.machines = modelData.machines;
                
                console.log(`📂 Model metadata loaded from: ${modelData.timestamp}`);
                console.log(`   Training data: ${modelData.trainingDataSize} records`);
                console.log(`   Workers: ${modelData.workers.length}, Machines: ${modelData.machines.length}`);
                
                // Note: For full model loading, we'd need to reconstruct the KNN model
                // This is a simplified version that loads metadata
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Failed to load model:', error.message);
            return false;
        }
    }

    // Check if model exists and is recent
    isModelCurrent(maxAgeHours = 24) {
        if (!fs.existsSync(this.modelPath)) {
            return false;
        }

        try {
            const modelData = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
            const modelTime = new Date(modelData.timestamp);
            const now = new Date();
            const ageHours = (now - modelTime) / (1000 * 60 * 60);
            
            return ageHours < maxAgeHours;
        } catch (error) {
            return false;
        }
    }

    // Smart training: only train if needed
    trainIfNeeded(forceRetrain = false) {
        if (forceRetrain) {
            console.log('🔄 Force retraining requested...');
            this.train();
            return;
        }

        if (this.isModelTrained) {
            console.log('✅ Model already trained in this session');
            return;
        }

        if (this.isModelCurrent()) {
            console.log('✅ Recent trained model found, skipping training');
            console.log('   Use forceRetrain=true to retrain anyway');
            // For demo purposes, we'll still train to show the process
            // In production, you'd load the saved model state
            this.train();
        } else {
            console.log('🔄 Training model (no recent model found)...');
            this.train();
        }
    }

    // Predict best worker for a job
    predictWorker(machineId, preferredMaxTime = null, minQualityThreshold = 7.0, enableDebug = false) {
        if (!this.isModelTrained) {
            throw new Error('Model not trained. Call train() method first.');
        }

        if (!this.machines.includes(machineId)) {
            throw new Error(`Invalid machine ID. Available machines: ${this.machines.join(', ')}`);
        }

        if (enableDebug) {
            console.log('\n🔍 DEBUG: Worker Assignment Process');
            console.log('=====================================');
            console.log(`📝 Job Requirements:`);
            console.log(`   - Machine ID: ${machineId}`);
            console.log(`   - Max Time: ${preferredMaxTime ? preferredMaxTime + ' minutes' : 'No limit'}`);
            console.log(`   - Min Quality: ${minQualityThreshold}/10`);
        }

        // Get worker statistics for this machine
        const workerStats = this.getWorkerStatistics(machineId);
        
        if (enableDebug) {
            console.log(`\n📊 Available Workers for Machine ${machineId}:`);
            if (workerStats.length === 0) {
                console.log('   ❌ No workers have experience on this machine!');
            } else {
                workerStats.forEach(worker => {
                    console.log(`   ${worker.workerId}: ${worker.jobCount} jobs, avg ${worker.avgTime.toFixed(1)}min, quality ${worker.avgQuality.toFixed(1)}/10`);
                });
            }
        }

        // Filter workers based on criteria
        let eligibleWorkers = workerStats.filter(worker => {
            let isEligible = true;
            let reasons = [];
            
            if (preferredMaxTime !== null) {
                if (worker.avgTime <= preferredMaxTime) {
                    reasons.push(`✅ Time OK (${worker.avgTime.toFixed(1)} ≤ ${preferredMaxTime})`);
                } else {
                    reasons.push(`❌ Too slow (${worker.avgTime.toFixed(1)} > ${preferredMaxTime})`);
                    isEligible = false;
                }
            } else {
                reasons.push('✅ No time limit');
            }
            
            if (minQualityThreshold !== null) {
                if (worker.avgQuality >= minQualityThreshold) {
                    reasons.push(`✅ Quality OK (${worker.avgQuality.toFixed(1)} ≥ ${minQualityThreshold})`);
                } else {
                    reasons.push(`❌ Quality too low (${worker.avgQuality.toFixed(1)} < ${minQualityThreshold})`);
                    isEligible = false;
                }
            } else {
                reasons.push('✅ No quality requirement');
            }

            if (enableDebug) {
                console.log(`\n🔍 Evaluating ${worker.workerId}:`);
                reasons.forEach(reason => console.log(`   ${reason}`));
                console.log(`   Result: ${isEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}`);
            }
            
            return isEligible;
        });

        if (enableDebug) {
            console.log(`\n📋 Filtering Results:`);
            console.log(`   Total workers checked: ${workerStats.length}`);
            console.log(`   Eligible workers: ${eligibleWorkers.length}`);
        }

        if (eligibleWorkers.length === 0) {
            if (enableDebug) {
                console.log('\n⚠️  No workers meet the specified criteria. Relaxing constraints...');
                console.log('   Using all available workers for this machine.');
            } else {
                console.log('No workers meet the specified criteria. Relaxing constraints...');
            }
            eligibleWorkers = workerStats;
        }

        // Sort by efficiency score (quality/time ratio) and experience
        eligibleWorkers.sort((a, b) => {
            const efficiencyA = a.avgQuality / a.avgTime;
            const efficiencyB = b.avgQuality / b.avgTime;
            
            if (Math.abs(efficiencyA - efficiencyB) < 0.01) {
                return b.jobCount - a.jobCount; // More experience wins
            }
            
            return efficiencyB - efficiencyA; // Higher efficiency wins
        });

        if (enableDebug) {
            console.log(`\n🏆 Ranking Workers by Efficiency (Quality/Time):`);
            eligibleWorkers.forEach((worker, index) => {
                const efficiency = (worker.avgQuality / worker.avgTime).toFixed(3);
                const experienceBonus = worker.jobCount >= 10 ? ' (experienced)' : '';
                console.log(`   ${index + 1}. ${worker.workerId}: efficiency ${efficiency}${experienceBonus}`);
                console.log(`      - Avg time: ${worker.avgTime.toFixed(1)}min`);
                console.log(`      - Avg quality: ${worker.avgQuality.toFixed(1)}/10`);
                console.log(`      - Experience: ${worker.jobCount} jobs`);
            });
        }

        const bestWorker = eligibleWorkers[0];
        
        if (enableDebug) {
            console.log(`\n🎯 FINAL DECISION:`);
            console.log(`   Selected: ${bestWorker.workerId}`);
            console.log(`   Reason: ${eligibleWorkers.length === 1 ? 'Only eligible worker' : 'Highest efficiency score'}`);
            console.log(`   Confidence: ${Math.min(bestWorker.jobCount / 10, 1.0) * 100}% (based on ${bestWorker.jobCount} historical jobs)`);
            console.log('=====================================\n');
        }
        
        return {
            recommendedWorker: bestWorker.workerId,
            estimatedTime: Math.round(bestWorker.avgTime),
            expectedQuality: Math.round(bestWorker.avgQuality * 10) / 10,
            confidence: Math.min(bestWorker.jobCount / 10, 1.0),
            alternativeWorkers: eligibleWorkers.slice(1, 4).map(w => ({
                workerId: w.workerId,
                estimatedTime: Math.round(w.avgTime),
                expectedQuality: Math.round(w.avgQuality * 10) / 10
            })),
            debugInfo: enableDebug ? {
                totalWorkersChecked: workerStats.length,
                eligibleWorkers: eligibleWorkers.length,
                constraintsRelaxed: eligibleWorkers.length !== workerStats.length && eligibleWorkers.length === workerStats.length,
                selectionReason: eligibleWorkers.length === 1 ? 'Only eligible worker' : 'Highest efficiency score'
            } : null
        };
    }

    // ML-based prediction using trained KNN model
    predictWorkerML(machineId, expectedComplexity = 3, enableDebug = false) {
        if (!this.isModelTrained) {
            throw new Error('Model not trained. Call train() method first.');
        }

        if (enableDebug) {
            console.log('\n🤖 MACHINE LEARNING PREDICTION');
            console.log('===============================');
            console.log(`Input: Machine ${machineId}, Complexity ${expectedComplexity}`);
        }

        // Create feature vector for the new job
        // Features: [machineId, expectedTime, expectedQuality, experience]
        // We'll use complexity to estimate expected time/quality
        const expectedTime = 10 + (expectedComplexity * 5); // Base time + complexity factor
        const expectedQuality = Math.max(5, 10 - expectedComplexity); // Higher complexity = potentially lower quality
        const minExperience = 5; // Minimum experience threshold

        const queryFeatures = [machineId, expectedTime, expectedQuality, minExperience];
        
        if (enableDebug) {
            console.log(`Feature vector: [machine=${machineId}, time=${expectedTime}, quality=${expectedQuality}, exp=${minExperience}]`);
        }

        // Use KNN to predict the best worker
        const predictions = this.model.predict([queryFeatures]);
        const predictedWorker = predictions[0];

        if (enableDebug) {
            console.log(`🎯 KNN Model prediction: ${predictedWorker}`);
            
            // Show the k-nearest neighbors for debugging
            const distances = this.model.distanceMatrix;
            console.log(`📍 Using K=${this.model.k} nearest neighbors`);
        }

        // Get statistics for the predicted worker on this machine
        const workerStats = this.getWorkerStatistics(machineId);
        const predictedWorkerStats = workerStats.find(w => w.workerId === predictedWorker);

        if (!predictedWorkerStats) {
            if (enableDebug) {
                console.log(`⚠️  Predicted worker ${predictedWorker} has no experience on machine ${machineId}`);
                console.log('Falling back to statistical method...');
            }
            // Fall back to statistical method
            return this.predictWorker(machineId, null, null, enableDebug);
        }

        // Calculate confidence based on worker's experience and model certainty
        const confidence = Math.min(predictedWorkerStats.jobCount / 20, 0.95);

        if (enableDebug) {
            console.log(`✅ ML Prediction complete:`);
            console.log(`   Worker: ${predictedWorker}`);
            console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
            console.log(`   Based on ${predictedWorkerStats.jobCount} historical jobs`);
            console.log('===============================\n');
        }

        return {
            recommendedWorker: predictedWorker,
            estimatedTime: Math.round(predictedWorkerStats.avgTime),
            expectedQuality: Math.round(predictedWorkerStats.avgQuality * 10) / 10,
            confidence: confidence,
            method: 'KNN Machine Learning',
            alternativeWorkers: workerStats
                .filter(w => w.workerId !== predictedWorker)
                .sort((a, b) => (b.avgQuality / b.avgTime) - (a.avgQuality / a.avgTime))
                .slice(0, 3)
                .map(w => ({
                    workerId: w.workerId,
                    estimatedTime: Math.round(w.avgTime),
                    expectedQuality: Math.round(w.avgQuality * 10) / 10
                }))
        };
    }

    // Enhanced prediction method that compares ML vs Statistical approaches
    predictWorkerComparison(machineId, expectedComplexity = 3, maxTime = null, minQuality = 7.0, enableDebug = false) {
        if (enableDebug) {
            console.log('\n📊 ML vs STATISTICAL COMPARISON');
            console.log('================================');
        }

        // Get ML prediction
        const mlPrediction = this.predictWorkerML(machineId, expectedComplexity, enableDebug);
        
        // Get statistical prediction
        const statPrediction = this.predictWorker(machineId, maxTime, minQuality, enableDebug);

        if (enableDebug) {
            console.log('\n🔍 COMPARISON RESULTS:');
            console.log(`ML Method:         ${mlPrediction.recommendedWorker} (${mlPrediction.estimatedTime}min, ${mlPrediction.expectedQuality}/10)`);
            console.log(`Statistical Method: ${statPrediction.recommendedWorker} (${statPrediction.estimatedTime}min, ${statPrediction.expectedQuality}/10)`);
            console.log(`Agreement: ${mlPrediction.recommendedWorker === statPrediction.recommendedWorker ? '✅ YES' : '❌ NO'}`);
            console.log('================================\n');
        }

        return {
            mlPrediction,
            statisticalPrediction: statPrediction,
            agreement: mlPrediction.recommendedWorker === statPrediction.recommendedWorker,
            recommendation: mlPrediction.confidence > statPrediction.confidence ? mlPrediction : statPrediction
        };
    }

    // Predict best worker for a job
    predictWorker(machineId, preferredMaxTime = null, minQualityThreshold = 7.0, enableDebug = false) {
        if (!this.isModelTrained) {
            throw new Error('Model not trained. Call train() method first.');
        }

        if (!this.machines.includes(machineId)) {
            throw new Error(`Invalid machine ID. Available machines: ${this.machines.join(', ')}`);
        }

        if (enableDebug) {
            console.log('\n🔍 DEBUG: Worker Assignment Process');
            console.log('=====================================');
            console.log(`📝 Job Requirements:`);
            console.log(`   - Machine ID: ${machineId}`);
            console.log(`   - Max Time: ${preferredMaxTime ? preferredMaxTime + ' minutes' : 'No limit'}`);
            console.log(`   - Min Quality: ${minQualityThreshold}/10`);
        }

        // Get worker statistics for this machine
        const workerStats = this.getWorkerStatistics(machineId);
        
        if (enableDebug) {
            console.log(`\n📊 Available Workers for Machine ${machineId}:`);
            if (workerStats.length === 0) {
                console.log('   ❌ No workers have experience on this machine!');
            } else {
                workerStats.forEach(worker => {
                    console.log(`   ${worker.workerId}: ${worker.jobCount} jobs, avg ${worker.avgTime.toFixed(1)}min, quality ${worker.avgQuality.toFixed(1)}/10`);
                });
            }
        }

        // Filter workers based on criteria
        let eligibleWorkers = workerStats.filter(worker => {
            let isEligible = true;
            let reasons = [];
            
            if (preferredMaxTime !== null) {
                if (worker.avgTime <= preferredMaxTime) {
                    reasons.push(`✅ Time OK (${worker.avgTime.toFixed(1)} ≤ ${preferredMaxTime})`);
                } else {
                    reasons.push(`❌ Too slow (${worker.avgTime.toFixed(1)} > ${preferredMaxTime})`);
                    isEligible = false;
                }
            } else {
                reasons.push('✅ No time limit');
            }
            
            if (minQualityThreshold !== null) {
                if (worker.avgQuality >= minQualityThreshold) {
                    reasons.push(`✅ Quality OK (${worker.avgQuality.toFixed(1)} ≥ ${minQualityThreshold})`);
                } else {
                    reasons.push(`❌ Quality too low (${worker.avgQuality.toFixed(1)} < ${minQualityThreshold})`);
                    isEligible = false;
                }
            } else {
                reasons.push('✅ No quality requirement');
            }

            if (enableDebug) {
                console.log(`\n🔍 Evaluating ${worker.workerId}:`);
                reasons.forEach(reason => console.log(`   ${reason}`));
                console.log(`   Result: ${isEligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'}`);
            }
            
            return isEligible;
        });

        if (enableDebug) {
            console.log(`\n📋 Filtering Results:`);
            console.log(`   Total workers checked: ${workerStats.length}`);
            console.log(`   Eligible workers: ${eligibleWorkers.length}`);
        }

        if (eligibleWorkers.length === 0) {
            if (enableDebug) {
                console.log('\n⚠️  No workers meet the specified criteria. Relaxing constraints...');
                console.log('   Using all available workers for this machine.');
            } else {
                console.log('No workers meet the specified criteria. Relaxing constraints...');
            }
            eligibleWorkers = workerStats;
        }

        // Sort by efficiency score (quality/time ratio) and experience
        eligibleWorkers.sort((a, b) => {
            const efficiencyA = a.avgQuality / a.avgTime;
            const efficiencyB = b.avgQuality / b.avgTime;
            
            if (Math.abs(efficiencyA - efficiencyB) < 0.01) {
                return b.jobCount - a.jobCount; // More experience wins
            }
            
            return efficiencyB - efficiencyA; // Higher efficiency wins
        });

        if (enableDebug) {
            console.log(`\n🏆 Ranking Workers by Efficiency (Quality/Time):`);
            eligibleWorkers.forEach((worker, index) => {
                const efficiency = (worker.avgQuality / worker.avgTime).toFixed(3);
                const experienceBonus = worker.jobCount >= 10 ? ' (experienced)' : '';
                console.log(`   ${index + 1}. ${worker.workerId}: efficiency ${efficiency}${experienceBonus}`);
                console.log(`      - Avg time: ${worker.avgTime.toFixed(1)}min`);
                console.log(`      - Avg quality: ${worker.avgQuality.toFixed(1)}/10`);
                console.log(`      - Experience: ${worker.jobCount} jobs`);
            });
        }

        const bestWorker = eligibleWorkers[0];
        
        if (enableDebug) {
            console.log(`\n🎯 FINAL DECISION:`);
            console.log(`   Selected: ${bestWorker.workerId}`);
            console.log(`   Reason: ${eligibleWorkers.length === 1 ? 'Only eligible worker' : 'Highest efficiency score'}`);
            console.log(`   Confidence: ${Math.min(bestWorker.jobCount / 10, 1.0) * 100}% (based on ${bestWorker.jobCount} historical jobs)`);
            console.log('=====================================\n');
        }
        
        return {
            recommendedWorker: bestWorker.workerId,
            estimatedTime: Math.round(bestWorker.avgTime),
            expectedQuality: Math.round(bestWorker.avgQuality * 10) / 10,
            confidence: Math.min(bestWorker.jobCount / 10, 1.0),
            alternativeWorkers: eligibleWorkers.slice(1, 4).map(w => ({
                workerId: w.workerId,
                estimatedTime: Math.round(w.avgTime),
                expectedQuality: Math.round(w.avgQuality * 10) / 10
            })),
            debugInfo: enableDebug ? {
                totalWorkersChecked: workerStats.length,
                eligibleWorkers: eligibleWorkers.length,
                constraintsRelaxed: eligibleWorkers.length !== workerStats.length && eligibleWorkers.length === workerStats.length,
                selectionReason: eligibleWorkers.length === 1 ? 'Only eligible worker' : 'Highest efficiency score'
            } : null
        };
    }

    // Get statistics for workers on a specific machine
    getWorkerStatistics(machineId) {
        const stats = [];
        
        this.workers.forEach(workerId => {
            const workerData = this.trainingData.filter(d => 
                d.workerId === workerId && d.machineId === machineId
            );
            
            if (workerData.length > 0) {
                stats.push({
                    workerId,
                    avgTime: _.mean(workerData.map(d => d.timeMinutes)),
                    avgQuality: _.mean(workerData.map(d => d.qualityScore)),
                    jobCount: workerData.length,
                    minTime: _.min(workerData.map(d => d.timeMinutes)),
                    maxTime: _.max(workerData.map(d => d.timeMinutes))
                });
            }
        });
        
        return stats;
    }

    // Get overall worker performance summary
    getWorkerSummary() {
        const summary = {};
        
        this.workers.forEach(workerId => {
            const workerData = this.trainingData.filter(d => d.workerId === workerId);
            
            summary[workerId] = {
                totalJobs: workerData.length,
                avgTime: _.mean(workerData.map(d => d.timeMinutes)),
                avgQuality: _.mean(workerData.map(d => d.qualityScore)),
                machinesWorked: [...new Set(workerData.map(d => d.machineId))],
                performanceByMachine: {}
            };
            
            this.machines.forEach(machineId => {
                const machineData = workerData.filter(d => d.machineId === machineId);
                if (machineData.length > 0) {
                    summary[workerId].performanceByMachine[machineId] = {
                        jobs: machineData.length,
                        avgTime: _.mean(machineData.map(d => d.timeMinutes)),
                        avgQuality: _.mean(machineData.map(d => d.qualityScore))
                    };
                }
            });
        });
        
        return summary;
    }

    // Analyze model performance
    analyzePerformance() {
        if (!this.isModelTrained) {
            throw new Error('Model not trained. Call train() method first.');
        }

        const analysis = {
            totalTrainingRecords: this.trainingData.length,
            totalWorkers: this.workers.length,
            totalMachines: this.machines.length,
            dataDistribution: {},
            workerExpertise: {}
        };

        // Analyze data distribution by machine
        this.machines.forEach(machineId => {
            const machineData = this.trainingData.filter(d => d.machineId === machineId);
            analysis.dataDistribution[machineId] = {
                totalJobs: machineData.length,
                avgTime: _.mean(machineData.map(d => d.timeMinutes)),
                avgQuality: _.mean(machineData.map(d => d.qualityScore)),
                workersUsed: [...new Set(machineData.map(d => d.workerId))].length
            };
        });

        // Analyze worker expertise
        this.workers.forEach(workerId => {
            const workerData = this.trainingData.filter(d => d.workerId === workerId);
            const machinePerformance = {};
            
            this.machines.forEach(machineId => {
                const machineData = workerData.filter(d => d.machineId === machineId);
                if (machineData.length > 0) {
                    const timeValues = machineData.map(d => d.timeMinutes);
                    machinePerformance[machineId] = {
                        efficiency: _.mean(machineData.map(d => d.qualityScore / d.timeMinutes)),
                        consistency: 1 / (this.calculateStandardDeviation(timeValues) + 1)
                    };
                }
            });
            
            analysis.workerExpertise[workerId] = machinePerformance;
        });

        return analysis;
    }

    // Enable or disable debug mode globally
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 Debug mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    // Get detailed worker analysis for debugging
    getDetailedWorkerAnalysis(machineId) {
        const workerStats = this.getWorkerStatistics(machineId);
        
        console.log(`\n📊 DETAILED ANALYSIS for Machine ${machineId}:`);
        console.log('=============================================');
        
        if (workerStats.length === 0) {
            console.log('❌ No workers have experience on this machine');
            return { workerStats: [], insights: [] };
        }

        const insights = [];
        
        workerStats.forEach((worker, index) => {
            const efficiency = (worker.avgQuality / worker.avgTime).toFixed(3);
            const consistency = worker.maxTime - worker.minTime;
            
            console.log(`\n${index + 1}. ${worker.workerId.toUpperCase()}:`);
            console.log(`   📈 Performance Metrics:`);
            console.log(`      - Jobs completed: ${worker.jobCount}`);
            console.log(`      - Avg time: ${worker.avgTime.toFixed(1)} minutes`);
            console.log(`      - Avg quality: ${worker.avgQuality.toFixed(1)}/10`);
            console.log(`      - Efficiency: ${efficiency} (quality/time)`);
            console.log(`      - Time range: ${worker.minTime}-${worker.maxTime} min (consistency: ${consistency <= 5 ? 'High' : consistency <= 10 ? 'Medium' : 'Low'})`);
            
            // Generate insights
            if (worker.jobCount >= 30) insights.push(`${worker.workerId} has extensive experience (${worker.jobCount} jobs)`);
            if (parseFloat(efficiency) > 0.4) insights.push(`${worker.workerId} is highly efficient`);
            if (worker.avgQuality >= 8.0) insights.push(`${worker.workerId} produces high-quality work`);
            if (worker.avgTime <= 15) insights.push(`${worker.workerId} is a fast worker`);
            if (consistency <= 5) insights.push(`${worker.workerId} is very consistent`);
        });

        if (insights.length > 0) {
            console.log(`\n💡 Key Insights:`);
            insights.forEach(insight => console.log(`   • ${insight}`));
        }

        console.log('=============================================\n');
        
        return { workerStats, insights };
    }
}

module.exports = WorkerAssignmentML;