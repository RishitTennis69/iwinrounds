// Collection of debate topics organized by categories
const debateTopics = {
  politics: [
    "This house believes that social media platforms should be regulated by the government",
    "This house believes that voting should be mandatory for all citizens",
    "This house believes that political campaigns should be publicly funded",
    "This house believes that the electoral college should be abolished",
    "This house believes that term limits should be imposed on all elected officials"
  ],
  education: [
    "This house believes that standardized testing should be abolished",
    "This house believes that college education should be free for all students",
    "This house believes that homework should be banned in schools",
    "This house believes that school uniforms should be mandatory",
    "This house believes that students should be able to choose their own curriculum"
  ],
  technology: [
    "This house believes that artificial intelligence will do more harm than good",
    "This house believes that social media has a negative impact on society",
    "This house believes that autonomous vehicles should be mandatory by 2030",
    "This house believes that cryptocurrency should replace traditional currency",
    "This house believes that internet access should be a human right"
  ],
  environment: [
    "This house believes that climate change is the most pressing issue of our time",
    "This house believes that nuclear energy is the best solution to climate change",
    "This house believes that individuals should be taxed for their carbon footprint",
    "This house believes that plastic should be completely banned",
    "This house believes that renewable energy should be mandatory for all new buildings"
  ],
  society: [
    "This house believes that the death penalty should be abolished worldwide",
    "This house believes that universal basic income should be implemented",
    "This house believes that professional athletes are overpaid",
    "This house believes that beauty pageants should be banned",
    "This house believes that fast food should be taxed like cigarettes"
  ],
  health: [
    "This house believes that healthcare should be a universal right",
    "This house believes that junk food should be banned in schools",
    "This house believes that mental health days should be mandatory for workers",
    "This house believes that organ donation should be opt-out rather than opt-in",
    "This house believes that alternative medicine should be covered by insurance"
  ],
  economics: [
    "This house believes that the minimum wage should be increased significantly",
    "This house believes that billionaires should not exist",
    "This house believes that the 4-day workweek should be standard",
    "This house believes that international trade does more harm than good",
    "This house believes that automation will lead to widespread unemployment"
  ],
  ethics: [
    "This house believes that animal testing should be completely banned",
    "This house believes that genetic engineering of humans should be allowed",
    "This house believes that privacy is more important than security",
    "This house believes that lying is sometimes justified",
    "This house believes that everyone has the right to die"
  ]
};

// Flatten all topics into a single array
const allTopics = Object.values(debateTopics).flat();

/**
 * Generates three random debate topics for users to choose from
 * @returns Array of three unique debate topics
 */
export const generateRandomTopics = (): string[] => {
  const topics = [...allTopics];
  const selectedTopics: string[] = [];
  
  // Select three random topics
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * topics.length);
    selectedTopics.push(topics[randomIndex]);
    topics.splice(randomIndex, 1); // Remove selected topic to avoid duplicates
  }
  
  return selectedTopics;
};

/**
 * Generates a single random debate topic
 * @returns A random debate topic
 */
export const generateSingleRandomTopic = (): string => {
  const randomIndex = Math.floor(Math.random() * allTopics.length);
  return allTopics[randomIndex];
};

/**
 * Gets topics by category
 * @param category The category of topics to retrieve
 * @returns Array of topics from the specified category
 */
export const getTopicsByCategory = (category: keyof typeof debateTopics): string[] => {
  return debateTopics[category] || [];
};

/**
 * Gets all available categories
 * @returns Array of category names
 */
export const getCategories = (): string[] => {
  return Object.keys(debateTopics);
}; 