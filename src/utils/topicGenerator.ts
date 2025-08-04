// Collection of debate topics organized by format
const debateTopics = {
  // Lincoln-Douglas: Values-based, moral, philosophical debates
  lincolnDouglas: [
    "Resolved: Civil disobedience in a democracy is morally justified.",
    "Resolved: Justice requires the recognition of animal rights.",
    "Resolved: The pursuit of knowledge is more valuable than the pursuit of happiness.",
    "Resolved: Individual liberty is more important than collective security.",
    "Resolved: Truth is more important than loyalty.",
    "Resolved: The ends justify the means.",
    "Resolved: Democracy is the best form of government.",
    "Resolved: Human nature is inherently good.",
    "Resolved: The right to privacy is absolute.",
    "Resolved: Morality is objective, not subjective."
  ],
  
  // Public Forum: Current events, actor-action format
  publicForum: [
    "Resolved: The United States should ban TikTok nationwide due to national security concerns.",
    "Resolved: The United States should increase its military presence in the South China Sea.",
    "Resolved: The United States should implement a federal carbon tax.",
    "Resolved: The United States should provide universal healthcare.",
    "Resolved: The United States should abolish the death penalty.",
    "Resolved: The United States should legalize all drugs.",
    "Resolved: The United States should implement a wealth tax.",
    "Resolved: The United States should require mandatory voting.",
    "Resolved: The United States should provide free college education.",
    "Resolved: The United States should implement a four-day workweek."
  ],
  
  // Policy Debate: Evidence-heavy, detailed policy analysis
  policy: [
    "Resolved: The United States federal government should substantially increase its investment in nuclear fusion energy.",
    "Resolved: The United States federal government should substantially increase its funding for public transportation.",
    "Resolved: The United States federal government should substantially increase its regulation of artificial intelligence.",
    "Resolved: The United States federal government should substantially increase its investment in renewable energy.",
    "Resolved: The United States federal government should substantially increase its funding for mental health services.",
    "Resolved: The United States federal government should substantially increase its regulation of social media platforms.",
    "Resolved: The United States federal government should substantially increase its investment in space exploration.",
    "Resolved: The United States federal government should substantially increase its funding for public education.",
    "Resolved: The United States federal government should substantially increase its regulation of cryptocurrency.",
    "Resolved: The United States federal government should substantially increase its investment in infrastructure."
  ],
  
  // Parliamentary: Government vs Opposition, current events
  parliamentary: [
    "This House would require all elected officials to pass a basic civics exam before taking office.",
    "This House would ban all social media for users under 16.",
    "This House would implement a universal basic income.",
    "This House would require all companies to have at least 40% female board members.",
    "This House would ban all single-use plastics.",
    "This House would make voting mandatory for all citizens.",
    "This House would abolish all private schools.",
    "This House would implement a four-day workweek.",
    "This House would ban all fossil fuel vehicles by 2030.",
    "This House would require all politicians to release their tax returns."
  ],
  
  // SPAR: Rapid-fire, competitive, often theatrical
  spar: [
    "Resolved: In a battle of wits, AI will never surpass human creativity.",
    "Resolved: Pizza is better than hamburgers.",
    "Resolved: Summer is better than winter.",
    "Resolved: Dogs are better pets than cats.",
    "Resolved: Reading books is better than watching movies.",
    "Resolved: Technology makes us more isolated.",
    "Resolved: Money can buy happiness.",
    "Resolved: Video games are a waste of time.",
    "Resolved: Social media is ruining society.",
    "Resolved: The best things in life are free."
  ]
};

// Flatten all topics into a single array for general use
const allTopics = Object.values(debateTopics).flat();

/**
 * Generates three random debate topics for users to choose from
 * @param format Optional debate format to get format-specific topics
 * @returns Array of three unique debate topics
 */
export const generateRandomTopics = (format?: string): string[] => {
  let topics: string[] = [];
  
  // Get format-specific topics if format is provided
  if (format && debateTopics[format as keyof typeof debateTopics]) {
    topics = [...debateTopics[format as keyof typeof debateTopics]];
  } else {
    // Use all topics for general selection
    topics = [...allTopics];
  }
  
  const selectedTopics: string[] = [];
  
  // Select three random topics
  for (let i = 0; i < 3; i++) {
    if (topics.length === 0) break; // Prevent infinite loop if not enough topics
    const randomIndex = Math.floor(Math.random() * topics.length);
    selectedTopics.push(topics[randomIndex]);
    topics.splice(randomIndex, 1); // Remove selected topic to avoid duplicates
  }
  
  return selectedTopics;
};

/**
 * Generates a single random debate topic
 * @param format Optional debate format to get format-specific topic
 * @returns A random debate topic
 */
export const generateSingleRandomTopic = (format?: string): string => {
  let topics: string[] = [];
  
  // Get format-specific topics if format is provided
  if (format && debateTopics[format as keyof typeof debateTopics]) {
    topics = debateTopics[format as keyof typeof debateTopics];
  } else {
    // Use all topics for general selection
    topics = allTopics;
  }
  
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
};

/**
 * Gets topics by format
 * @param format The format of topics to retrieve
 * @returns Array of topics from the specified format
 */
export const getTopicsByFormat = (format: keyof typeof debateTopics): string[] => {
  return debateTopics[format] || [];
};

/**
 * Gets all available formats
 * @returns Array of available debate formats
 */
export const getFormats = (): string[] => {
  return Object.keys(debateTopics);
}; 