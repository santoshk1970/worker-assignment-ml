const WorkerAssignmentML = require('../src/WorkerAssignmentML');
const { loadDataFromCSV } = require('./generateHistoricalData');
const fs = require('fs');
const path = require('path');

async function debugDemo() {
    console.log('🐛 Worker Assignment Debug Demo');
    console.log('===============================\n');

    try {
        // Load historical data
        const dataPath = path.join(__dirname, '..', 'data', 'historical_data.json');
        if (!fs.existsSync(dataPath)) {
            console.log('❌ No data found. Run: npm run generate-data');
            return;
        }

        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`📁 Loaded ${data.historicalData.length} historical records\n`);

        // Initialize ML system
        const mlSystem = new WorkerAssignmentML();
        mlSystem.addHistoricalData(data.historicalData);
        mlSystem.train();

        // Enable debug mode
        mlSystem.setDebugMode(true);

        // Demo 1: Detailed worker analysis
        console.log('\n📊 DEMO 1: Detailed Worker Analysis');
        console.log('===================================');
        mlSystem.getDetailedWorkerAnalysis(1);
        mlSystem.getDetailedWorkerAnalysis(3);

        // Demo 2: Debug predictions with different constraints
        console.log('\n🎯 DEMO 2: Debug Predictions');
        console.log('============================');

        const debugTests = [
            {
                name: "Easy Job",
                machineId: 1,
                maxTime: null,
                minQuality: 6.0,
                description: "Machine 1, low quality threshold"
            },
            {
                name: "Challenging Job",
                machineId: 2,
                maxTime: 15,
                minQuality: 8.5,
                description: "Machine 2, fast + high quality"
            },
            {
                name: "Impossible Job",
                machineId: 4,
                maxTime: 5,
                minQuality: 9.8,
                description: "Machine 4, unrealistic requirements"
            }
        ];

        debugTests.forEach((test, index) => {
            console.log(`\n🧪 DEBUG TEST ${index + 1}: ${test.name}`);
            console.log(`Description: ${test.description}`);
            console.log(''.padEnd(50, '-'));

            try {
                const prediction = mlSystem.predictWorker(
                    test.machineId,
                    test.maxTime,
                    test.minQuality,
                    true // Enable debug
                );

                console.log(`✅ SUCCESS: Assigned ${prediction.recommendedWorker}`);
                if (prediction.debugInfo) {
                    console.log(`   Debug Info: ${JSON.stringify(prediction.debugInfo, null, 2)}`);
                }
            } catch (error) {
                console.log(`❌ ERROR: ${error.message}`);
            }
        });

        // Demo 3: Compare predictions with and without debug
        console.log('\n🔄 DEMO 3: Quick Comparison (Debug OFF)');
        console.log('========================================');
        
        mlSystem.setDebugMode(false);
        
        const quickTest = {
            machineId: 3,
            maxTime: 20,
            minQuality: 7.5
        };

        const prediction = mlSystem.predictWorker(
            quickTest.machineId,
            quickTest.maxTime,
            quickTest.minQuality,
            false
        );

        console.log(`Machine ${quickTest.machineId} assignment: ${prediction.recommendedWorker}`);
        console.log(`Estimated: ${prediction.estimatedTime}min, Quality: ${prediction.expectedQuality}/10`);

        console.log('\n🎉 Debug demo completed!');
        console.log('\nTo run debug mode:');
        console.log('node scripts/debugDemo.js');

    } catch (error) {
        console.error('❌ Error in debug demo:', error.message);
        console.error(error.stack);
    }
}

// Export for use in other scripts
function enableDebugForPrediction(mlSystem, jobRequest) {
    console.log('\n🔍 PREDICTION DEBUG MODE');
    console.log('========================');
    console.log(`Job: Machine ${jobRequest.machineId}`);
    if (jobRequest.maxTime) console.log(`Max Time: ${jobRequest.maxTime} minutes`);
    if (jobRequest.minQuality) console.log(`Min Quality: ${jobRequest.minQuality}/10`);
    
    const prediction = mlSystem.predictWorker(
        jobRequest.machineId,
        jobRequest.maxTime || null,
        jobRequest.minQuality || null,
        true
    );
    
    return prediction;
}

if (require.main === module) {
    debugDemo();
}

module.exports = {
    debugDemo,
    enableDebugForPrediction
};
