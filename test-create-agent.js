/**
 * Test script to create an agent directly using fetch
 */

// Simple API client for testing
const apiClient = {
  async post(url, data) {
    // Get the full URL for the API request
    const baseUrl = 'http://localhost:3000';
    const fullUrl = new URL(url, baseUrl);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
};

async function testCreateAgent() {
  try {
    console.log('Starting test - creating a product data agent');
    
    // Create a product data agent directly using the API
    const result = await apiClient.post('/api/agents', {
      name: "Product Data Agent",
      description: "Manages product information and inventory for an online store",
      type: "custom",
      icon: "shopping-bag",
      status: "active",
      configuration: {
        capabilities: [
          "Product information retrieval",
          "Inventory management",
          "Product recommendations",
          "Data analysis"
        ],
        integrations: ["Ecommerce platforms", "Inventory systems"]
      }
    });
    
    console.log('API response:', JSON.stringify(result, null, 2));
    console.log('Product data agent created successfully with ID:', result.id);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Execute the test
testCreateAgent()
  .then(result => console.log('Agent created:', result?.name))
  .catch(error => console.error('Error:', error));