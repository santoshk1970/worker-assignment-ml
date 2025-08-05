const DataService = require('./DataService');
const MLService = require('./MLService');
const DemoService = require('./DemoService');

class AppService {
    constructor() {
        this.dataService = new DataService();
        this.mlService = new MLService();
        this.demoService = new DemoService(this.mlService);
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🎯 Worker Assignment ML System');
        console.log('==============================\n');

        try {
            // Load historical data
            const historicalData = await this.dataService.loadHistoricalData();
            
            // Initialize ML service
            await this.mlService.initialize(historicalData);
            
            return { success: true, message: 'Application initialized successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Run the complete demo
     */
    async runDemo() {
        if (!this.mlService.isReady()) {
            throw new Error('Application not initialized. Call initialize() first.');
        }

        await this.demoService.runFullDemo();
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            data: this.dataService.getDataInfo(),
            ml: this.mlService.getStatus(),
            ready: this.mlService.isReady()
        };
    }

    /**
     * Get service instances for direct access
     */
    getServices() {
        return {
            data: this.dataService,
            ml: this.mlService,
            demo: this.demoService
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        // Add any cleanup logic here
        console.log('🧹 Cleaning up resources...');
    }
}

module.exports = AppService;
