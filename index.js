const AppService = require('./src/services/AppService');

/**
 * Main application entry point
 * Clean skeleton that delegates to service layer
 */
async function main() {
    const app = new AppService();

    try {
        // Initialize application
        const initResult = await app.initialize();
        
        if (!initResult.success) {
            console.error('❌ Failed to initialize application:', initResult.error);
            process.exit(1);
        }

        // Run the complete demo
        await app.runDemo();

        // Optionally show status
        if (process.env.SHOW_STATUS) {
            console.log('\n📊 Application Status:');
            console.log(JSON.stringify(app.getStatus(), null, 2));
        }

    } catch (error) {
        console.error('❌ Application Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Cleanup
        await app.cleanup();
    }
}

// Export for use in other modules
module.exports = { main };

// Run if called directly
if (require.main === module) {
    main();
}
