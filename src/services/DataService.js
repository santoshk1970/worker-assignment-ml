const fs = require('fs');
const path = require('path');
const { generateHistoricalData } = require('../../scripts/generateHistoricalData');

class DataService {
    constructor() {
        this.dataPath = path.join(__dirname, '..', '..', 'data', 'historical_data.json');
    }

    /**
     * Load or generate historical data
     * @returns {Array} Historical data records
     */
    async loadHistoricalData() {
        if (fs.existsSync(this.dataPath)) {
            console.log('📁 Loading existing historical data...');
            const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
            return data.historicalData;
        } else {
            console.log('📊 Generating new historical data...');
            const data = generateHistoricalData({ 
                numWorkers: 8, 
                recordsPerWorker: 50,
                machineTypes: 5 
            });
            return data.historicalData;
        }
    }

    /**
     * Check if historical data exists
     * @returns {boolean}
     */
    hasHistoricalData() {
        return fs.existsSync(this.dataPath);
    }

    /**
     * Get data file information
     * @returns {Object} Data file stats
     */
    getDataInfo() {
        if (!this.hasHistoricalData()) {
            return { exists: false, size: 0, records: 0 };
        }

        try {
            const stats = fs.statSync(this.dataPath);
            const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
            
            return {
                exists: true,
                size: stats.size,
                records: data.historicalData ? data.historicalData.length : 0,
                lastModified: stats.mtime
            };
        } catch (error) {
            return { exists: false, size: 0, records: 0, error: error.message };
        }
    }
}

module.exports = DataService;
