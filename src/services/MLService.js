const WorkerAssignmentML = require('../WorkerAssignmentML');

class MLService {
    constructor() {
        this.mlSystem = new WorkerAssignmentML();
        this.isInitialized = false;
    }

    /**
     * Initialize the ML system with historical data
     * @param {Array} historicalData - Training data
     */
    async initialize(historicalData) {
        if (this.isInitialized) {
            console.log('⚠️ ML Service already initialized');
            return;
        }

        this.mlSystem.addHistoricalData(historicalData);
        this.mlSystem.trainIfNeeded();
        this.isInitialized = true;

        console.log('\n🎓 Model Training Complete!');
        console.log('============================');
    }

    /**
     * Force retrain the model
     */
    async retrain() {
        if (!this.isInitialized) {
            throw new Error('ML Service not initialized. Call initialize() first.');
        }
        
        console.log('🔄 Force retraining model...');
        this.mlSystem.trainIfNeeded(true);
    }

    /**
     * Get the ML system instance
     * @returns {WorkerAssignmentML}
     */
    getMLSystem() {
        if (!this.isInitialized) {
            throw new Error('ML Service not initialized. Call initialize() first.');
        }
        return this.mlSystem;
    }

    /**
     * Check if service is ready
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && this.mlSystem.isModelTrained;
    }

    /**
     * Get service status
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            modelTrained: this.mlSystem.isModelTrained,
            workers: this.mlSystem.workers.length,
            trainingRecords: this.mlSystem.trainingData.length,
            machines: this.mlSystem.machines.length
        };
    }
}

module.exports = MLService;
