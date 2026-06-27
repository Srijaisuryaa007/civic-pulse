import dotenv from 'dotenv';
dotenv.config();

const VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_KEY;

// Fallback tags for simulation mode
const FALLBACK_TAGS = [
  'Asphalt', 'Road surface', 'Infrastructure', 'Damage', 'Pavement',
  'Pothole', 'Tar', 'Waste', 'Plastic bag', 'Litter', 'Water leak',
  'Puddle', 'Streetlight', 'Electricity', 'Concrete', 'Urban area'
];

/**
 * Call Google Cloud Vision API (via REST API using API Key) or mock if missing.
 * @param {Buffer} imageBuffer - The image file buffer.
 * @param {string} originalFilename - Original filename to help seed simulations.
 * @returns {Promise<string[]>} List of detected labels.
 */
export const analyzeImageWithVision = async (imageBuffer, originalFilename = '') => {
  if (!VISION_API_KEY || VISION_API_KEY === 'your_google_cloud_vision_key_here') {
    console.log("ℹ️ Vision API Key not found. Simulating image tags...");
    return simulateVisionTags(originalFilename);
  }

  try {
    const base64Image = imageBuffer.toString('base64');
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 5
            }
          ]
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API error status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const annotations = data.responses?.[0];
    
    if (annotations?.error) {
      throw new Error(annotations.error.message);
    }

    const labels = (annotations?.labelAnnotations || []).map(label => label.description);
    const objects = (annotations?.localizedObjectAnnotations || []).map(obj => obj.name);
    
    // Combine labels and objects
    const allTags = [...new Set([...labels, ...objects])];
    
    if (allTags.length === 0) {
      return simulateVisionTags(originalFilename);
    }

    console.log(`✅ Vision API successfully analyzed image. Tags: ${allTags.join(', ')}`);
    return allTags;
  } catch (error) {
    console.error(`⚠️ Vision API failed (${error.message}). Falling back to simulation...`);
    return simulateVisionTags(originalFilename);
  }
};

/**
 * Simulates vision tags based on hints in the file name or random selection.
 */
function simulateVisionTags(filename) {
  const fileLower = (filename || '').toLowerCase();
  const tags = ['Infrastructure', 'Urban area'];

  if (fileLower.includes('pothole') || fileLower.includes('road') || fileLower.includes('street')) {
    tags.push('Pothole', 'Asphalt', 'Road surface', 'Damage', 'Pavement');
  } else if (fileLower.includes('water') || fileLower.includes('leak') || fileLower.includes('pipe') || fileLower.includes('drain')) {
    tags.push('Water leak', 'Puddle', 'Liquid', 'Drainage', 'Pipe');
  } else if (fileLower.includes('light') || fileLower.includes('lamp') || fileLower.includes('bulb') || fileLower.includes('dark')) {
    tags.push('Streetlight', 'Lamp post', 'Lighting', 'Electricity', 'Night');
  } else if (fileLower.includes('waste') || fileLower.includes('trash') || fileLower.includes('garbage') || fileLower.includes('plastic') || fileLower.includes('dump')) {
    tags.push('Waste', 'Trash', 'Garbage dump', 'Plastic bag', 'Litter', 'Pollution');
  } else {
    // Return a random selection of 5-8 tags from FALLBACK_TAGS
    const count = 5 + Math.floor(Math.random() * 4);
    const shuffled = [...FALLBACK_TAGS].sort(() => 0.5 - Math.random());
    tags.push(...shuffled.slice(0, count));
  }

  return [...new Set(tags)];
}
