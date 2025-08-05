# Worker Assignment ML System

![Node.js](https://img.shields.io/badge/node.js-v14+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![ML Algorithm](https://img.shields.io/badge/algorithm-KNN-orange.svg)
![Demo](https://img.shields.io/badge/demo-interactive-brightgreen.svg)
![Status](https://img.shields.io/badge/status-production--ready-success.svg)

A Node.js machine learning project that assigns workers to jobs based on historical performance data. The system uses machine learning algorithms to predict the best worker for each job based on machine type and job complexity.

## 🎯 Project Overview

This project demonstrates a practical machine learning application for workforce optimization. Given historical data about workers' performance on different types of machines, the system can predict which worker should be assigned to new jobs to minimize completion time.

### Problem Statement
- **Workers**: Multiple workers with different skill levels
- **Machines**: 5 different types of machines (1-5)
- **Jobs**: Each job has a machine type and complexity level (1-5)
- **Goal**: Assign the optimal worker to minimize job completion time

## 🏗️ Project Structure

```
machinelearning/
├── package.json                 # Project dependencies and scripts
├── index.js                    # Main application entry point
├── test.js                     # Comprehensive test suite
├── README.md                   # Project documentation
├── scripts/
│   └── generateData.js         # Data generation utilities
└── src/
    ├── WorkerAssignmentML.js   # Main ML system class
    └── dataGenerator.js        # Historical data generator
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Historical Data

```bash
npm run generate-data
```

This creates realistic historical worker performance data with:
- 8 workers with different skill profiles
- 5 machines with varying complexity
- ~2000+ historical job records
- Worker specializations and experience levels

### 3. Run the Application

```bash
npm start
```

This will:
- Load historical data (or generate if not found)
- Train the machine learning model
- Demonstrate worker assignments for new jobs
- Show performance insights

### 4. Load and Test CSV Data

```bash
npm run load-csv
```

### 5. Export Data to Different Formats

```bash
npm run export-csv
```

### 6. View Generated Data

```bash
npm run view-data
```

### 7. Debug Mode - See How Decisions Are Made

```bash
npm run debug
```

This shows detailed logs of:
- How workers are evaluated for each job
- Why certain workers are rejected or selected  
- Efficiency calculations and ranking process
- Confidence scoring methodology

## 📊 Sample Data Structure

### Historical Job Record
```javascript
{
  workerId: "priya",
  machineId: 2,
  timeMinutes: 18.5,
  qualityScore: 8.7,
  jobDate: "2024-07-15",
  shift: "morning",
  jobType: "production"
}
```

### Job Assignment Request
```javascript
{
  machineId: 3,
  maxTime: 20,
  minQuality: 8.0
}
```

### Assignment Response
```javascript
{
  recommendedWorker: "edward",
  estimatedTime: 16,
  expectedQuality: 8.5,
  confidence: 0.85,
  alternatives: [
    { workerId: "john", estimatedTime: 18, expectedQuality: 8.1 },
    { workerId: "ankit", estimatedTime: 19, expectedQuality: 7.9 }
  ]
}
```

## 🧠 Machine Learning Approach

### Algorithm
- **Primary**: K-Nearest Neighbors (KNN) for worker-job matching
- **Features**: Normalized machine type and job complexity
- **Target**: Worker efficiency score based on historical performance

### Key Features
1. **Worker Specialization**: Identifies workers who perform better on specific machines
2. **Complexity Scaling**: Adjusts predictions based on job complexity
3. **Confidence Scoring**: Provides confidence levels for assignments
4. **Alternative Suggestions**: Offers backup worker options

### Performance Metrics
- **Predicted Completion Time**: Estimated time for job completion
- **Efficiency Score**: Worker performance rating (0-1)
- **Confidence Level**: Reliability of the prediction (0-1)

## 📈 Sample Workers and Specializations

The system generates realistic worker profiles with diverse names:

- **John**: Fast on machines 1,2 (0.8× base speed)
- **Priya**: Good on machines 2,3 (0.9× base speed)
- **Edward**: Fast on machines 3,4 (0.85× base speed)
- **Raj**: Very fast on machines 4,5 (0.75× base speed)
- **Sarah**: Slower but works on 1,5 (1.1× base speed)  
- **Ankit**: Balanced, good on 1,2,3 (0.95× base speed)
- **Maria**: Good on 3,4,5 (0.88× base speed)
- **Vikram**: New worker, slower overall (1.2× base speed)

## 🛠️ API Usage

### Basic Usage

```javascript
const WorkerAssignmentML = require('./src/WorkerAssignmentML');
const { generateHistoricalData } = require('./scripts/generateHistoricalData');

// Initialize system
const mlSystem = new WorkerAssignmentML();

// Generate and train with historical data
const data = generateHistoricalData({ numWorkers: 8, recordsPerWorker: 50 });
mlSystem.addHistoricalData(data.historicalData);
mlSystem.train();

// Assign worker to new job
const newJob = {
  machineId: 3,
  maxTime: 20,
  minQuality: 8.0
};

const assignment = mlSystem.predictWorker(newJob.machineId, newJob.maxTime, newJob.minQuality);
console.log(`Assign ${assignment.recommendedWorker} - ${assignment.estimatedTime} min`);
```

### Advanced Usage

```javascript
// Get performance insights
const workerSummary = mlSystem.getWorkerSummary();
console.log('Worker performance:', workerSummary);

// Enable debug mode to see decision process
const debugPrediction = mlSystem.predictWorker(
  3,     // machineId
  20,    // maxTime  
  8.0,   // minQuality
  true   // enableDebug - shows detailed matching process
);

// Get detailed worker analysis for a specific machine
mlSystem.getDetailedWorkerAnalysis(1);

// Batch job processing
const jobs = [
  { machineId: 1, maxTime: null, minQuality: 8.0 },
  { machineId: 2, maxTime: 15, minQuality: 7.0 },
  { machineId: 3, maxTime: 20, minQuality: 8.5 }
];

jobs.forEach((job, index) => {
  const assignment = mlSystem.predictWorker(job.machineId, job.maxTime, job.minQuality);
  console.log(`Job ${index + 1}: ${assignment.recommendedWorker} (${assignment.estimatedTime}min)`);
});
```

### Debug Mode Example Output

```
🔍 DEBUG: Worker Assignment Process
=====================================
📝 Job Requirements:
   - Machine ID: 2
   - Max Time: 15 minutes
   - Min Quality: 8.0/10

📊 Available Workers for Machine 2:
   john: 25 jobs, avg 18.2min, quality 7.5/10
   priya: 30 jobs, avg 14.1min, quality 8.3/10
   raj: 22 jobs, avg 16.8min, quality 8.1/10

🔍 Evaluating john:
   ❌ Too slow (18.2 > 15)
   ❌ Quality too low (7.5 < 8.0)
   Result: ❌ NOT ELIGIBLE

🔍 Evaluating priya:
   ✅ Time OK (14.1 ≤ 15)
   ✅ Quality OK (8.3 ≥ 8.0)
   Result: ✅ ELIGIBLE

🎯 FINAL DECISION:
   Selected: priya
   Reason: Highest efficiency score
   Confidence: 100% (based on 30 historical jobs)
```

## 📚 Key Concepts Demonstrated

### Machine Learning Concepts
1. **Feature Engineering**: Converting categorical data to numerical features
2. **Normalization**: Scaling features to [0,1] range
3. **K-Nearest Neighbors**: Finding similar historical cases
4. **Prediction Confidence**: Measuring reliability of predictions
5. **Model Training**: Learning from historical data patterns

### Software Engineering Concepts
1. **Modular Design**: Separation of concerns across classes
2. **Data Generation**: Creating realistic synthetic datasets
3. **Testing**: Comprehensive test coverage
4. **Documentation**: Clear API and usage examples
5. **Error Handling**: Graceful handling of edge cases

## 🔧 Dependencies

- **ml-knn**: K-Nearest Neighbors algorithm implementation
- **ml-matrix**: Matrix operations for ML calculations
- **ml-regression**: Regression analysis tools
- **lodash**: Utility functions for data manipulation
- **csv-parser**: CSV file reading capabilities
- **csv-writer**: CSV file generation

## 📊 Performance Insights

The system provides detailed insights:

- **Worker Performance**: Average completion times per worker
- **Machine Specialists**: Best workers for each machine type
- **Efficiency Trends**: Performance patterns over time
- **Confidence Metrics**: Reliability of predictions

## 🎓 Learning Outcomes

This project teaches:

1. **Practical ML Application**: Real-world problem solving with ML
2. **Data Preprocessing**: Cleaning and preparing data for ML
3. **Feature Engineering**: Creating meaningful input features
4. **Model Evaluation**: Assessing prediction quality
5. **System Design**: Building scalable ML systems

## 🚀 Future Enhancements

Potential improvements:
- Real-time learning from new job completions
- Integration with scheduling systems
- Advanced algorithms (Random Forest, Neural Networks)
- Performance visualization dashboard
- Multi-objective optimization (time, cost, quality)

## 📝 License

MIT License - Feel free to use this project for learning and development.

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new ML algorithms
- Improve data generation
- Add visualization features
- Enhance the test suite
- Optimize performance

---

**Happy Learning! 🎓**
