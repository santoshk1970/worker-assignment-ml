const WorkerAssignmentML = require('./src/WorkerAssignmentML');
const { generateHistoricalData } = require('./scripts/generateHistoricalData');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🎯 Worker Assignment ML System');
    console.log('==============================\n');

    try {
        // Initialize the ML system
        const mlSystem = new WorkerAssignmentML();

        // Check if historical data exists, if not generate it
        const dataPath = path.join(__dirname, 'data', 'historical_data.json');
        let historicalData;

        if (fs.existsSync(dataPath)) {
            console.log('📁 Loading existing historical data...');
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            historicalData = data.historicalData;
        } else {
            console.log('📊 Generating new historical data...');
            const data = generateHistoricalData({ 
                numWorkers: 8, 
                recordsPerWorker: 50,
                machineTypes: 5 
            });
            historicalData = data.historicalData;
        }

        // Add historical data and train the model
        mlSystem.addHistoricalData(historicalData);
        mlSystem.train();

        console.log('\n🎓 Model Training Complete!');
        console.log('============================');

        // Demonstrate the difference between ML and Statistical approaches
        console.log('\n🤖 MACHINE LEARNING vs STATISTICAL COMPARISON');
        console.log('==============================================');

        // Example jobs with varying complexity
        const mlDemoJobs = [
            { machineId: 1, complexity: 2, description: "Simple job on Machine 1" },
            { machineId: 2, complexity: 4, description: "Complex job on Machine 2" },
            { machineId: 3, complexity: 3, description: "Medium complexity on Machine 3" },
            { machineId: 4, complexity: 5, description: "Very complex job on Machine 4" }
        ];

        mlDemoJobs.forEach((job, index) => {
            console.log(`\n${index + 1}. ${job.description} (Complexity: ${job.complexity}/5)`);
            console.log(''.padEnd(50, '-'));

            try {
                // Show pure ML prediction
                const mlPrediction = mlSystem.predictWorkerML(job.machineId, job.complexity);
                console.log('🤖 ML Prediction (KNN):', {
                    worker: mlPrediction.recommendedWorker,
                    time: `${mlPrediction.estimatedTime}min`,
                    quality: `${mlPrediction.expectedQuality}/10`,
                    method: mlPrediction.method,
                    confidence: `${Math.round(mlPrediction.confidence * 100)}%`
                });

                // Show statistical prediction for comparison
                const statPrediction = mlSystem.predictWorker(job.machineId, null, 7.0);
                console.log('📊 Statistical Prediction:', {
                    worker: statPrediction.recommendedWorker,
                    time: `${statPrediction.estimatedTime}min`,
                    quality: `${statPrediction.expectedQuality}/10`,
                    confidence: `${Math.round(statPrediction.confidence * 100)}%`
                });

                // Highlight differences
                if (mlPrediction.recommendedWorker !== statPrediction.recommendedWorker) {
                    console.log('� Prediction Difference:', 
                        `ML chose ${mlPrediction.recommendedWorker}, ` +
                        `Statistical chose ${statPrediction.recommendedWorker}`
                    );
                } else {
                    console.log('✅ Both methods agree on:', mlPrediction.recommendedWorker);
                }

            } catch (error) {
                console.log('   ❌ Error:', error.message);
            }
        });

        // Show detailed ML explanation for one example
        console.log('\n🔬 DETAILED ML ANALYSIS EXAMPLE');
        console.log('===============================');
        console.log('Demonstrating how KNN finds similar historical patterns...\n');
        
        try {
            const detailedExample = mlSystem.predictWorkerML(3, 4, true); // Enable debug
        } catch (error) {
            console.log('Error in detailed analysis:', error.message);
        }

        // Show worker performance summary
        console.log('\n📊 Worker Performance Summary:');
        console.log('==============================');
        const summary = mlSystem.getWorkerSummary();
        
        Object.entries(summary).forEach(([workerId, stats]) => {
            console.log(`\n${workerId.toUpperCase()}:`);
            console.log(`  📈 Total jobs: ${stats.totalJobs}`);
            console.log(`  ⏱️  Avg time: ${stats.avgTime.toFixed(1)} minutes`);
            console.log(`  ⭐ Avg quality: ${stats.avgQuality.toFixed(1)}/10`);
            console.log(`  🔧 Machines: ${stats.machinesWorked.join(', ')}`);
            
            // Show best machine for each worker
            let bestMachine = null;
            let bestEfficiency = 0;
            
            Object.entries(stats.performanceByMachine).forEach(([machineId, perf]) => {
                const efficiency = perf.avgQuality / perf.avgTime;
                if (efficiency > bestEfficiency) {
                    bestEfficiency = efficiency;
                    bestMachine = machineId;
                }
            });
            
            if (bestMachine) {
                const bestPerf = stats.performanceByMachine[bestMachine];
                console.log(`  🏆 Best on Machine ${bestMachine}: ${bestPerf.avgTime.toFixed(1)}min, ${bestPerf.avgQuality.toFixed(1)}/10`);
            }
        });

        // Show model performance analysis
        console.log('\n🔍 Model Analysis:');
        console.log('==================');
        const analysis = mlSystem.analyzePerformance();
        
        console.log(`📚 Training data: ${analysis.totalTrainingRecords} records`);
        console.log(`👥 Workers: ${analysis.totalWorkers}`);
        console.log(`🏭 Machines: ${analysis.totalMachines}`);
        
        console.log('\n🏭 Machine Distribution:');
        Object.entries(analysis.dataDistribution).forEach(([machineId, stats]) => {
            console.log(`  Machine ${machineId}: ${stats.totalJobs} jobs, avg ${stats.avgTime.toFixed(1)}min, quality ${stats.avgQuality.toFixed(1)}/10`);
        });

        console.log('\n✨ System ready for production use!');
        
        console.log('\n🧠 WHY THIS IS REAL MACHINE LEARNING:');
        console.log('====================================');
        console.log('1. 🎯 Feature Engineering: Raw data → numerical features [machineId, avgTime, avgQuality, jobCount]');
        console.log('2. 🏗️  Model Training: K-Nearest Neighbors algorithm learns patterns from historical data');
        console.log('3. 🔍 Pattern Recognition: Model finds similar historical jobs to predict outcomes');
        console.log('4. 🎲 Generalization: Makes predictions for NEW job combinations never seen before');
        console.log('5. 📊 Different from lookup: Statistical method uses averages, ML finds nearest neighbors');
        console.log('6. 🔄 Learning: As more data is added, predictions improve automatically');
        
        console.log('\n💡 Tips:');
        console.log('   - Use npm run debug for detailed assignment logs');
        console.log('   - Use npm run generate-data to create new training data');
        console.log('   - Check README.md for API usage examples');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

// Export for use in other modules
module.exports = { main };

// Run if called directly
if (require.main === module) {
    main();
}
