import fs from 'fs';

const filePath = './src/components/admin/ProductManager.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace the fetchMeasurements function with logging
const oldFunc = `  const fetchMeasurements = async (fitType: string) => {
    setLoadingMeasurements(true);
    try {
      const response = await fetch(\`/api/measurements?fitType=\${fitType}\`);
      if (response.ok) {
        const data = await response.json();
        setMeasurements(data);
      }
    } catch (err) {
      console.error('Error fetching measurements:', err);
    } finally {
      setLoadingMeasurements(false);
    }
  };`;

const newFunc = `  const fetchMeasurements = async (fitType: string) => {
    console.log(\`🔄 Fetching \${fitType} measurements...\`);
    setLoadingMeasurements(true);
    try {
      const response = await fetch(\`/api/measurements?fitType=\${fitType}\`);
      console.log(\`API Response status: \${response.status}\`);
      if (response.ok) {
        const data = await response.json();
        console.log(\`📦 Fetched \${fitType} measurements:\`, data);
        console.log(\`📊 Measurement count: \${data.length}\`);
        setMeasurements(data);
      } else {
        console.error(\`❌ API Error: \${response.status} \${response.statusText}\`);
        setMeasurements([]);
      }
    } catch (err) {
      console.error('Error fetching measurements:', err);
      setMeasurements([]);
    } finally {
      setLoadingMeasurements(false);
    }
  };`;

content = content.replace(oldFunc, newFunc);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('✅ ProductManager.tsx updated with logging!');
