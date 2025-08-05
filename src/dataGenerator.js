const _ = require('lodash');

/**
 * Generate sample historical job data for training
 */
function generateSampleData(numRecords = 200) {
    const workers = ['W001', 'W002', 'W003', 'W004', 'W005', 'W006', 'W007', 'W008'];
    const machines = [1, 2, 3, 4, 5];
    const data = [];

    // Define worker skill profiles (some workers are better at certain machines)
    const workerProfiles = {
        'W001': { specialty: [1, 2], baseSpeed: 0.8 },      // Fast on machines 1,2
        'W002': { specialty: [2, 3], baseSpeed: 0.9 },      // Good on machines 2,3
        'W003': { specialty: [3, 4], baseSpeed: 0.85 },     // Fast on machines 3,4
        'W004': { specialty: [4, 5], baseSpeed: 0.75 },     // Very fast on machines 4,5
        'W005': { specialty: [1, 5], baseSpeed: 1.1 },      // Slower but works on 1,5
        'W006': { specialty: [1, 2, 3], baseSpeed: 0.95 },  // Balanced, good on 1,2,3
        'W007': { specialty: [3, 4, 5], baseSpeed: 0.88 },  // Good on 3,4,5
        'W008': { specialty: [], baseSpeed: 1.2 }            // New worker, slower overall
    };

    for (let i = 0; i < numRecords; i++) {
        const workerId = _.sample(workers);
        const machineType = _.sample(machines);
        const complexity = _.random(1, 5);
        
        // Calculate completion time based on worker profile
        const profile = workerProfiles[workerId];
        let baseTime = 5 + (complexity * 4); // Base time: 5-25 minutes
        
        // Apply worker speed modifier
        baseTime *= profile.baseSpeed;
        
        // Apply specialty bonus/penalty
        if (profile.specialty.includes(machineType)) {
            baseTime *= 0.8; // 20% faster on specialty machines
        } else if (profile.specialty.length > 0) {
            baseTime *= 1.2; // 20% slower on non-specialty machines
        }
        
        // Add some randomness
        baseTime *= (0.8 + Math.random() * 0.4); // ±20% variation
        
        // Round to 1 decimal place
        const completionTime = Math.round(baseTime * 10) / 10;
        
        data.push({
            jobId: `JOB_${String(i + 1).padStart(4, '0')}`,
            workerId,
            machineType,
            complexity,
            completionTime,
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
        });
    }

    return _.sortBy(data, 'timestamp');
}

/**
 * Generate specific test scenarios
 */
function generateTestScenarios() {
    return [
        {
            name: "High Complexity Jobs",
            jobs: [
                { jobId: 'TEST001', machineType: 1, estimatedComplexity: 5 },
                { jobId: 'TEST002', machineType: 3, estimatedComplexity: 5 },
                { jobId: 'TEST003', machineType: 5, estimatedComplexity: 5 }
            ]
        },
        {
            name: "Low Complexity Jobs",
            jobs: [
                { jobId: 'TEST004', machineType: 2, estimatedComplexity: 1 },
                { jobId: 'TEST005', machineType: 4, estimatedComplexity: 1 },
                { jobId: 'TEST006', machineType: 1, estimatedComplexity: 1 }
            ]
        },
        {
            name: "Mixed Complexity",
            jobs: [
                { jobId: 'TEST007', machineType: 1, estimatedComplexity: 2 },
                { jobId: 'TEST008', machineType: 2, estimatedComplexity: 3 },
                { jobId: 'TEST009', machineType: 3, estimatedComplexity: 4 },
                { jobId: 'TEST010', machineType: 4, estimatedComplexity: 2 },
                { jobId: 'TEST011', machineType: 5, estimatedComplexity: 3 }
            ]
        }
    ];
}

/**
 * Export historical data to CSV format
 */
function exportToCSV(data) {
    const header = 'jobId,workerId,machineType,complexity,completionTime,timestamp\n';
    const rows = data.map(record => 
        `${record.jobId},${record.workerId},${record.machineType},${record.complexity},${record.completionTime},${record.timestamp.toISOString()}`
    ).join('\n');
    
    return header + rows;
}

/**
 * Get summary statistics of the generated data
 */
function getDataSummary(data) {
    const summary = {
        totalRecords: data.length,
        workers: [...new Set(data.map(d => d.workerId))].sort(),
        machines: [...new Set(data.map(d => d.machineType))].sort(),
        complexityRange: {
            min: Math.min(...data.map(d => d.complexity)),
            max: Math.max(...data.map(d => d.complexity))
        },
        timeRange: {
            min: Math.min(...data.map(d => d.completionTime)),
            max: Math.max(...data.map(d => d.completionTime)),
            avg: _.mean(data.map(d => d.completionTime))
        },
        jobsPerWorker: {}
    };

    // Count jobs per worker
    data.forEach(record => {
        summary.jobsPerWorker[record.workerId] = (summary.jobsPerWorker[record.workerId] || 0) + 1;
    });

    return summary;
}

module.exports = {
    generateSampleData,
    generateTestScenarios,
    exportToCSV,
    getDataSummary
};
