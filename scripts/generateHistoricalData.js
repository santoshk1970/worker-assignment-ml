const fs = require('fs');
const path = require('path');

// Generate realistic historical worker data
function generateHistoricalData(options = {}) {
    const {
        numWorkers = 8,
        numMachines = 5,
        recordsPerWorker = 50,
        timeRange = { min: 8, max: 35 },
        qualityRange = { min: 5.0, max: 10.0 }
    } = options;

    const workers = [];
    const machines = [];
    const historicalData = [];

    // Create worker profiles with different skill sets
    const workerNames = [
        'John', 'Priya', 'Edward', 'Raj', 'Sarah', 'Ankit', 'Maria', 'Vikram'
    ];
    
    for (let i = 1; i <= numWorkers; i++) {
        const workerName = workerNames[i - 1] || `Worker${i}`;
        workers.push({
            id: workerName.toLowerCase(),
            name: workerName,
            experience: Math.random() * 10 + 1, // 1-11 years
            specialization: Math.floor(Math.random() * numMachines) + 1,
            skillLevel: Math.random() * 0.4 + 0.6 // 0.6-1.0 skill multiplier
        });
    }

    // Create machine profiles
    for (let i = 1; i <= numMachines; i++) {
        machines.push({
            id: i,
            name: `Machine ${i}`,
            complexity: Math.random() * 0.5 + 0.5, // 0.5-1.0 complexity
            maintenanceState: Math.random() > 0.8 ? 'needs_maintenance' : 'good'
        });
    }

    // Generate historical job records
    workers.forEach(worker => {
        for (let jobNum = 0; jobNum < recordsPerWorker; jobNum++) {
            machines.forEach(machine => {
                // Skip some machine-worker combinations to create realistic gaps
                if (Math.random() < 0.3) return;

                // Calculate base time and quality based on worker-machine compatibility
                let baseTime = timeRange.min + (Math.random() * (timeRange.max - timeRange.min));
                let baseQuality = qualityRange.min + (Math.random() * (qualityRange.max - qualityRange.min));

                // Worker specialization affects performance
                if (worker.specialization === machine.id) {
                    baseTime *= 0.7; // 30% faster on specialized machine
                    baseQuality *= 1.2; // 20% better quality
                } else if (Math.abs(worker.specialization - machine.id) > 2) {
                    baseTime *= 1.3; // 30% slower on unfamiliar machine
                    baseQuality *= 0.9; // 10% lower quality
                }

                // Experience affects performance
                const experienceBonus = worker.experience / 15;
                baseTime *= (1 - experienceBonus * 0.2); // Up to 20% faster with experience
                baseQuality *= (1 + experienceBonus * 0.1); // Up to 10% better quality

                // Skill level affects performance
                baseTime *= (2 - worker.skillLevel); // Higher skill = faster
                baseQuality *= worker.skillLevel; // Higher skill = better quality

                // Machine complexity affects time
                baseTime *= machine.complexity;

                // Machine maintenance state affects quality
                if (machine.maintenanceState === 'needs_maintenance') {
                    baseQuality *= 0.85; // 15% quality reduction
                    baseTime *= 1.1; // 10% time increase
                }

                // Add some randomness to simulate real-world variation
                baseTime += (Math.random() - 0.5) * 4; // ±2 minutes variation
                baseQuality += (Math.random() - 0.5) * 0.8; // ±0.4 quality variation

                // Ensure values are within reasonable bounds
                const finalTime = Math.max(5, Math.round(baseTime));
                const finalQuality = Math.max(1, Math.min(10, Math.round(baseQuality * 10) / 10));

                historicalData.push({
                    workerId: worker.id,
                    machineId: machine.id,
                    timeMinutes: finalTime,
                    qualityScore: finalQuality,
                    jobDate: generateRandomDate(),
                    shift: generateRandomShift(),
                    jobType: generateRandomJobType()
                });
            });
        }
    });

    return {
        workers,
        machines,
        historicalData: shuffleArray(historicalData)
    };
}

// Helper functions
function generateRandomDate() {
    const start = new Date(2023, 0, 1);
    const end = new Date(2024, 11, 31);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
        .toISOString().split('T')[0];
}

function generateRandomShift() {
    const shifts = ['morning', 'afternoon', 'night'];
    return shifts[Math.floor(Math.random() * shifts.length)];
}

function generateRandomJobType() {
    const jobTypes = ['maintenance', 'production', 'setup', 'quality_check', 'calibration'];
    return jobTypes[Math.floor(Math.random() * jobTypes.length)];
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Save data to different formats
function saveDataToJSON(data, filename = 'historical_data.json') {
    const filepath = path.join(__dirname, '..', 'data', filename);
    
    // Ensure data directory exists
    const dataDir = path.dirname(filepath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ Data saved to ${filepath}`);
    return filepath;
}

function saveDataToCSV(historicalData, filename = 'historical_data.csv') {
    const filepath = path.join(__dirname, '..', 'data', filename);
    
    // Ensure data directory exists
    const dataDir = path.dirname(filepath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // CSV header
    const header = 'workerId,machineId,timeMinutes,qualityScore,jobDate,shift,jobType\n';
    
    // CSV rows
    const rows = historicalData.map(record => 
        `${record.workerId},${record.machineId},${record.timeMinutes},${record.qualityScore},${record.jobDate},${record.shift},${record.jobType}`
    ).join('\n');
    
    fs.writeFileSync(filepath, header + rows);
    console.log(`✅ CSV data saved to ${filepath}`);
    return filepath;
}

// Load data from CSV
function loadDataFromCSV(filename = 'historical_data.csv') {
    const filepath = path.join(__dirname, '..', 'data', filename);
    
    if (!fs.existsSync(filepath)) {
        throw new Error(`CSV file not found: ${filepath}`);
    }
    
    const csvContent = fs.readFileSync(filepath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const record = {};
        
        headers.forEach((header, index) => {
            const value = values[index];
            
            // Convert numeric fields
            if (header === 'machineId' || header === 'timeMinutes') {
                record[header] = parseInt(value);
            } else if (header === 'qualityScore') {
                record[header] = parseFloat(value);
            } else {
                record[header] = value;
            }
        });
        
        return record;
    });
    
    console.log(`✅ Loaded ${data.length} records from ${filepath}`);
    return data;
}

// Generate data summary statistics
function generateDataSummary(data) {
    const summary = {
        totalRecords: data.historicalData.length,
        dateRange: {
            earliest: null,
            latest: null
        },
        workerStats: {},
        machineStats: {},
        overallStats: {
            avgTime: 0,
            avgQuality: 0,
            minTime: Infinity,
            maxTime: -Infinity,
            minQuality: Infinity,
            maxQuality: -Infinity
        }
    };

    // Calculate overall statistics
    const times = data.historicalData.map(d => d.timeMinutes);
    const qualities = data.historicalData.map(d => d.qualityScore);
    const dates = data.historicalData.map(d => d.jobDate).sort();

    summary.overallStats.avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    summary.overallStats.avgQuality = qualities.reduce((a, b) => a + b, 0) / qualities.length;
    summary.overallStats.minTime = Math.min(...times);
    summary.overallStats.maxTime = Math.max(...times);
    summary.overallStats.minQuality = Math.min(...qualities);
    summary.overallStats.maxQuality = Math.max(...qualities);
    summary.dateRange.earliest = dates[0];
    summary.dateRange.latest = dates[dates.length - 1];

    // Worker statistics
    data.workers.forEach(worker => {
        const workerData = data.historicalData.filter(d => d.workerId === worker.id);
        const workerTimes = workerData.map(d => d.timeMinutes);
        const workerQualities = workerData.map(d => d.qualityScore);

        summary.workerStats[worker.id] = {
            name: worker.name,
            experience: worker.experience,
            specialization: worker.specialization,
            skillLevel: worker.skillLevel,
            totalJobs: workerData.length,
            avgTime: workerTimes.reduce((a, b) => a + b, 0) / workerTimes.length,
            avgQuality: workerQualities.reduce((a, b) => a + b, 0) / workerQualities.length,
            efficiency: (workerQualities.reduce((a, b) => a + b, 0) / workerQualities.length) / 
                       (workerTimes.reduce((a, b) => a + b, 0) / workerTimes.length)
        };
    });

    // Machine statistics
    data.machines.forEach(machine => {
        const machineData = data.historicalData.filter(d => d.machineId === machine.id);
        const machineTimes = machineData.map(d => d.timeMinutes);
        const machineQualities = machineData.map(d => d.qualityScore);

        summary.machineStats[machine.id] = {
            name: machine.name,
            complexity: machine.complexity,
            maintenanceState: machine.maintenanceState,
            totalJobs: machineData.length,
            avgTime: machineTimes.reduce((a, b) => a + b, 0) / machineTimes.length,
            avgQuality: machineQualities.reduce((a, b) => a + b, 0) / machineQualities.length,
            uniqueWorkers: [...new Set(machineData.map(d => d.workerId))].length
        };
    });

    return summary;
}

// Main execution
if (require.main === module) {
    console.log('🏭 Generating Historical Worker Performance Data...\n');
    
    const options = {
        numWorkers: 8,
        numMachines: 5,
        recordsPerWorker: 60,
        timeRange: { min: 8, max: 35 },
        qualityRange: { min: 5.0, max: 10.0 }
    };
    
    const data = generateHistoricalData(options);
    const summary = generateDataSummary(data);
    
    console.log('📊 Generated Data Summary:');
    console.log(`- Workers: ${data.workers.length}`);
    console.log(`- Machines: ${data.machines.length}`);
    console.log(`- Historical Records: ${data.historicalData.length}`);
    console.log(`- Date Range: ${summary.dateRange.earliest} to ${summary.dateRange.latest}`);
    console.log(`- Avg Time: ${summary.overallStats.avgTime.toFixed(1)} minutes`);
    console.log(`- Avg Quality: ${summary.overallStats.avgQuality.toFixed(1)}/10`);
    
    console.log('\n👥 Worker Profiles:');
    data.workers.forEach(worker => {
        const stats = summary.workerStats[worker.id];
        console.log(`  ${worker.id}: ${worker.experience.toFixed(1)}y exp, specializes in Machine ${worker.specialization}, skill: ${(worker.skillLevel * 100).toFixed(0)}%, efficiency: ${stats.efficiency.toFixed(2)}`);
    });
    
    console.log('\n🔧 Machine Profiles:');
    data.machines.forEach(machine => {
        const stats = summary.machineStats[machine.id];
        console.log(`  Machine ${machine.id}: complexity ${(machine.complexity * 100).toFixed(0)}%, status: ${machine.maintenanceState}, avg time: ${stats.avgTime.toFixed(1)}min`);
    });
    
    // Save data in multiple formats
    console.log('\n💾 Saving data...');
    saveDataToJSON(data);
    saveDataToCSV(data.historicalData);
    
    // Save summary
    saveDataToJSON(summary, 'data_summary.json');
    
    console.log('\n🎉 Historical data generation completed!');
    console.log('\nGenerated files:');
    console.log('- data/historical_data.json (Complete dataset)');
    console.log('- data/historical_data.csv (CSV format)');
    console.log('- data/data_summary.json (Statistics)');
    console.log('\nTo use this data in your ML system:');
    console.log('1. Run: npm run generate-data');
    console.log('2. Use: mlSystem.addHistoricalData(historicalData)');
    console.log('3. Or load from CSV: npm run load-csv');
}

module.exports = {
    generateHistoricalData,
    saveDataToJSON,
    saveDataToCSV,
    loadDataFromCSV,
    generateDataSummary
};
