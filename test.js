const WorkerAssignmentML = require('./src/WorkerAssignmentML');
const { generateSampleData, generateTestScenarios, getDataSummary } = require('./src/dataGenerator');

async function runTests() {
    console.log('🧪 Running Worker Assignment ML Tests');
    console.log('====================================\n');

    try {
        // Test 1: Data Generation
        console.log('Test 1: Data Generation');
        console.log('-----------------------');
        const historicalData = generateSampleData(150);
        const summary = getDataSummary(historicalData);
        
        console.log(`✅ Generated ${summary.totalRecords} records`);
        console.log(`   Workers: ${summary.workers.join(', ')}`);
        console.log(`   Machines: ${summary.machines.join(', ')}`);
        console.log(`   Complexity range: ${summary.complexityRange.min}-${summary.complexityRange.max}`);
        console.log(`   Time range: ${summary.timeRange.min.toFixed(1)}-${summary.timeRange.max.toFixed(1)} min`);
        console.log(`   Average time: ${summary.timeRange.avg.toFixed(1)} min\n`);

        // Test 2: Model Training
        console.log('Test 2: Model Training');
        console.log('----------------------');
        const mlSystem = new WorkerAssignmentML();
        await mlSystem.train(historicalData);
        console.log('✅ Model training completed successfully\n');

        // Test 3: Single Job Assignment
        console.log('Test 3: Single Job Assignment');
        console.log('-----------------------------');
        const testJob = { jobId: 'TEST_SINGLE', machineType: 3, estimatedComplexity: 4 };
        const assignment = await mlSystem.assignWorker(testJob);
        
        console.log(`Job: ${testJob.jobId} (Machine ${testJob.machineType}, Complexity ${testJob.estimatedComplexity})`);
        console.log(`✅ Assigned to: Worker ${assignment.workerId}`);
        console.log(`   Predicted time: ${assignment.predictedTime.toFixed(1)} minutes`);
        console.log(`   Confidence: ${(assignment.confidence * 100).toFixed(1)}%`);
        
        if (assignment.alternatives && assignment.alternatives.length > 0) {
            console.log('   Alternatives:');
            assignment.alternatives.forEach((alt, i) => {
                console.log(`   ${i + 2}. Worker ${alt.workerId} - ${alt.predictedTime.toFixed(1)}min (${(alt.confidence * 100).toFixed(1)}%)`);
            });
        }
        console.log();

        // Test 4: Batch Job Assignment
        console.log('Test 4: Batch Job Assignment');
        console.log('----------------------------');
        const testScenarios = generateTestScenarios();
        
        for (const scenario of testScenarios) {
            console.log(`\n📋 Scenario: ${scenario.name}`);
            console.log(''.padEnd(scenario.name.length + 15, '-'));
            
            for (const job of scenario.jobs) {
                const assignment = await mlSystem.assignWorker(job);
                console.log(`${job.jobId} (M${job.machineType}, C${job.estimatedComplexity}): Worker ${assignment.workerId} - ${assignment.predictedTime.toFixed(1)}min`);
            }
        }

        // Test 5: Performance Insights
        console.log('\n\nTest 5: Performance Insights');
        console.log('----------------------------');
        const insights = mlSystem.getPerformanceInsights();
        
        console.log(`✅ Total jobs analyzed: ${insights.totalJobs}`);
        console.log(`   Workers: ${insights.workers}`);
        console.log(`   Machines: ${insights.machines}`);
        
        console.log('\n🏆 Top performers by machine:');
        Object.entries(insights.topPerformersByMachine).forEach(([machine, workerId]) => {
            console.log(`   Machine ${machine}: Worker ${workerId}`);
        });

        console.log('\n⚡ Top 3 fastest workers overall:');
        insights.fastestWorkers.slice(0, 3).forEach((worker, index) => {
            console.log(`   ${index + 1}. Worker ${worker.workerId}: ${worker.avgTime.toFixed(1)}min avg (${worker.jobCount} jobs)`);
        });

        // Test 6: Edge Cases
        console.log('\n\nTest 6: Edge Cases');
        console.log('------------------');
        
        // Test with extreme values
        const edgeCases = [
            { jobId: 'EDGE001', machineType: 1, estimatedComplexity: 1 }, // Min complexity
            { jobId: 'EDGE002', machineType: 5, estimatedComplexity: 5 }, // Max complexity
            { jobId: 'EDGE003', machineType: 3, estimatedComplexity: 3 }, // Average case
        ];

        for (const job of edgeCases) {
            const assignment = await mlSystem.assignWorker(job);
            console.log(`${job.jobId}: Worker ${assignment.workerId} - ${assignment.predictedTime.toFixed(1)}min (${(assignment.confidence * 100).toFixed(1)}%)`);
        }

        console.log('\n✅ All tests completed successfully!');
        
        // Performance Summary
        console.log('\n📊 Test Summary');
        console.log('===============');
        console.log('✅ Data generation: PASSED');
        console.log('✅ Model training: PASSED');
        console.log('✅ Job assignment: PASSED');
        console.log('✅ Batch processing: PASSED');
        console.log('✅ Performance insights: PASSED');
        console.log('✅ Edge cases: PASSED');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
