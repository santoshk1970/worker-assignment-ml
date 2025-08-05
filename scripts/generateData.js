const fs = require('fs');
const path = require('path');
const { generateSampleData, exportToCSV, getDataSummary } = require('../src/dataGenerator');

function generateData() {
    console.log('📊 Data Generation Script');
    console.log('========================\n');

    // Generate different sized datasets
    const datasets = [
        { name: 'small', size: 100 },
        { name: 'medium', size: 500 },
        { name: 'large', size: 1000 }
    ];

    const dataDir = path.join(__dirname, '..', 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    datasets.forEach(dataset => {
        console.log(`Generating ${dataset.name} dataset (${dataset.size} records)...`);
        
        const data = generateSampleData(dataset.size);
        const summary = getDataSummary(data);
        
        // Save as JSON
        const jsonPath = path.join(dataDir, `${dataset.name}_dataset.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
        
        // Save as CSV
        const csvPath = path.join(dataDir, `${dataset.name}_dataset.csv`);
        fs.writeFileSync(csvPath, exportToCSV(data));
        
        // Save summary
        const summaryPath = path.join(dataDir, `${dataset.name}_summary.json`);
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        
        console.log(`✅ ${dataset.name} dataset created:`);
        console.log(`   JSON: ${path.relative(process.cwd(), jsonPath)}`);
        console.log(`   CSV: ${path.relative(process.cwd(), csvPath)}`);
        console.log(`   Summary: ${path.relative(process.cwd(), summaryPath)}`);
        console.log(`   Records: ${summary.totalRecords}`);
        console.log(`   Workers: ${summary.workers.length}`);
        console.log(`   Average completion time: ${summary.timeRange.avg.toFixed(1)} minutes\n`);
    });

    console.log('🎉 Data generation completed!');
    console.log('\nYou can now use these datasets to:');
    console.log('- Train ML models with different data sizes');
    console.log('- Compare model performance');
    console.log('- Export data to other ML tools');
    console.log('- Visualize worker performance patterns');
}

if (require.main === module) {
    generateData();
}

module.exports = { generateData };
