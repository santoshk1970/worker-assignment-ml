const WorkerAssignmentML = require('../src/WorkerAssignmentML');
const { loadDataFromCSV } = require('./generateHistoricalData');
const fs = require('fs');
const path = require('path');

async function loadAndTestCSVData() {
    try {
        console.log('📁 Loading Historical Data from CSV...\n');
        
        // Load data from CSV
        const historicalData = loadDataFromCSV();
        
        console.log(`✅ Loaded ${historicalData.length} historical records`);
        
        // Show sample of loaded data
        console.log('\n📋 Sample Data (first 5 records):');
        historicalData.slice(0, 5).forEach((record, index) => {
            console.log(`${index + 1}. ${record.workerId} on Machine ${record.machineId}: ${record.timeMinutes}min, quality ${record.qualityScore}/10 (${record.jobDate})`);
        });
        
        // Initialize ML system with CSV data
        console.log('\n🤖 Initializing ML System with CSV data...');
        const mlSystem = new WorkerAssignmentML();
        mlSystem.addHistoricalData(historicalData);
        
        // Train the model
        console.log('\n🎯 Training the model...');
        mlSystem.train();
        
        // Test predictions
        console.log('\n🔮 Testing predictions with CSV data:');
        console.log('=====================================');
        
        const testCases = [
            { machineId: 1, maxTime: null, minQuality: 8.0, description: 'Machine 1, High Quality' },
            { machineId: 3, maxTime: 15, minQuality: 7.0, description: 'Machine 3, Fast & Good' },
            { machineId: 5, maxTime: null, minQuality: null, description: 'Machine 5, Any Worker' }
        ];
        
        testCases.forEach((testCase, index) => {
            console.log(`\nTest ${index + 1}: ${testCase.description}`);
            try {
                const prediction = mlSystem.predictWorker(
                    testCase.machineId, 
                    testCase.maxTime, 
                    testCase.minQuality
                );
                
                console.log(`✅ Recommended: ${prediction.recommendedWorker}`);
                console.log(`   Estimated time: ${prediction.estimatedTime} minutes`);
                console.log(`   Expected quality: ${prediction.expectedQuality}/10`);
                console.log(`   Confidence: ${Math.round(prediction.confidence * 100)}%`);
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        });
        
        // Show worker summary
        console.log('\n👥 Worker Performance Summary:');
        const workerSummary = mlSystem.getWorkerSummary();
        Object.entries(workerSummary).forEach(([workerId, stats]) => {
            console.log(`${workerId}: ${stats.totalJobs} jobs, avg ${Math.round(stats.avgTime)}min, quality ${stats.avgQuality.toFixed(1)}/10`);
        });
        
        console.log('\n🎉 CSV data loaded and tested successfully!');
        
    } catch (error) {
        console.error('❌ Error loading CSV data:', error.message);
        
        if (error.message.includes('CSV file not found')) {
            console.log('\n💡 To generate CSV data first, run:');
            console.log('npm run generate-data');
        }
    }
}

// Export data to different formats
function exportData() {
    const dataPath = path.join(__dirname, '..', 'data', 'historical_data.json');
    
    if (!fs.existsSync(dataPath)) {
        console.log('❌ No data found. Generate data first with: npm run generate-data');
        return;
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('📤 Exporting data to different formats...\n');
    
    // Export to Excel-friendly CSV
    const excelPath = path.join(__dirname, '..', 'data', 'historical_data_excel.csv');
    const excelHeader = 'Worker ID,Machine ID,Time (Minutes),Quality Score,Job Date,Shift,Job Type\n';
    const excelRows = data.historicalData.map(record => 
        `"${record.workerId}","${record.machineId}","${record.timeMinutes}","${record.qualityScore}","${record.jobDate}","${record.shift}","${record.jobType}"`
    ).join('\n');
    
    fs.writeFileSync(excelPath, excelHeader + excelRows);
    console.log(`✅ Excel-friendly CSV: ${excelPath}`);
    
    // Export worker summary CSV
    const workerSummaryPath = path.join(__dirname, '..', 'data', 'worker_summary.csv');
    const summaryHeader = 'Worker ID,Experience (Years),Specialization,Skill Level,Total Jobs,Avg Time,Avg Quality\n';
    const summaryRows = data.workers.map(worker => {
        const workerJobs = data.historicalData.filter(d => d.workerId === worker.id);
        const avgTime = workerJobs.reduce((sum, job) => sum + job.timeMinutes, 0) / workerJobs.length;
        const avgQuality = workerJobs.reduce((sum, job) => sum + job.qualityScore, 0) / workerJobs.length;
        
        return `"${worker.id}","${worker.experience.toFixed(1)}","Machine ${worker.specialization}","${(worker.skillLevel * 100).toFixed(0)}%","${workerJobs.length}","${avgTime.toFixed(1)}","${avgQuality.toFixed(1)}"`;
    }).join('\n');
    
    fs.writeFileSync(workerSummaryPath, summaryHeader + summaryRows);
    console.log(`✅ Worker summary CSV: ${workerSummaryPath}`);
    
    // Export machine summary CSV
    const machineSummaryPath = path.join(__dirname, '..', 'data', 'machine_summary.csv');
    const machineHeader = 'Machine ID,Complexity,Maintenance State,Total Jobs,Avg Time,Avg Quality,Unique Workers\n';
    const machineRows = data.machines.map(machine => {
        const machineJobs = data.historicalData.filter(d => d.machineId === machine.id);
        const avgTime = machineJobs.reduce((sum, job) => sum + job.timeMinutes, 0) / machineJobs.length;
        const avgQuality = machineJobs.reduce((sum, job) => sum + job.qualityScore, 0) / machineJobs.length;
        const uniqueWorkers = [...new Set(machineJobs.map(d => d.workerId))].length;
        
        return `"${machine.id}","${(machine.complexity * 100).toFixed(0)}%","${machine.maintenanceState}","${machineJobs.length}","${avgTime.toFixed(1)}","${avgQuality.toFixed(1)}","${uniqueWorkers}"`;
    }).join('\n');
    
    fs.writeFileSync(machineSummaryPath, machineHeader + machineRows);
    console.log(`✅ Machine summary CSV: ${machineSummaryPath}`);
    
    console.log('\n🎉 Data export completed!');
    console.log('\nGenerated files:');
    console.log('- historical_data_excel.csv (Excel-friendly format)');
    console.log('- worker_summary.csv (Worker performance summary)');
    console.log('- machine_summary.csv (Machine utilization summary)');
}

// Run based on command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--export')) {
        exportData();
    } else {
        loadAndTestCSVData();
    }
}

module.exports = {
    loadAndTestCSVData,
    exportData
};
