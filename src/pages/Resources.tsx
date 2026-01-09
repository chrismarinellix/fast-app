import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, ArrowLeft, ExternalLink, BookOpen, Youtube, Microscope,
  Users, Smartphone, GraduationCap, Heart, Podcast, FileText,
  Clock, X, ChevronRight
} from 'lucide-react';

const FASTING_APPS = [
  {
    name: 'Zero Fasting',
    url: 'https://zerofasting.com/',
    description: 'Popular app with community features and coaching',
  },
  {
    name: 'Ate Food Journal',
    url: 'https://youate.com/',
    description: 'Mindful eating and fasting tracker',
  },
  {
    name: 'Fastic',
    url: 'https://fastic.com/',
    description: 'Intermittent fasting app with meal plans',
  },
  {
    name: 'Simple: Intermittent Fasting',
    url: 'https://simple.life/',
    description: 'AI-powered fasting and nutrition guidance',
  },
];

const SCIENCE_RESOURCES = [
  {
    name: 'NIH Intermittent Fasting Research',
    url: 'https://www.nih.gov/news-events/nih-research-matters/intermittent-fasting-weight-loss-people-type-2-diabetes',
    description: 'Government research on fasting health benefits',
  },
  {
    name: 'PubMed - Intermittent Fasting Studies',
    url: 'https://pubmed.ncbi.nlm.nih.gov/?term=intermittent+fasting',
    description: 'Peer-reviewed scientific research database',
  },
  {
    name: 'New England Journal of Medicine',
    url: 'https://www.nejm.org/doi/full/10.1056/NEJMra1905136',
    description: 'Effects of Intermittent Fasting on Health, Aging, and Disease',
  },
  {
    name: 'Cell Metabolism - Time-Restricted Eating',
    url: 'https://www.cell.com/cell-metabolism/fulltext/S1550-4131(19)30611-4',
    description: 'Ten-Hour Time-Restricted Eating study',
  },
];

const EXPERT_CONTENT = [
  {
    name: 'Huberman Lab Podcast',
    url: 'https://hubermanlab.com/effects-of-fasting-and-time-restricted-eating-on-fat-loss-and-health/',
    description: 'Stanford neuroscientist on fasting science',
    icon: Podcast,
  },
  {
    name: 'Dr. Peter Attia',
    url: 'https://peterattiamd.com/category/fasting/',
    description: 'Longevity-focused physician on fasting protocols',
    icon: Heart,
  },
  {
    name: 'Dr. Jason Fung',
    url: 'https://www.dietdoctor.com/authors/dr-jason-fung-m-d',
    description: 'Nephrologist and fasting expert',
    icon: GraduationCap,
  },
  {
    name: 'Dr. Rhonda Patrick',
    url: 'https://www.foundmyfitness.com/topics/fasting',
    description: 'Biomedical scientist on fasting and longevity',
    icon: Microscope,
  },
];

const YOUTUBE_CHANNELS = [
  {
    name: 'Dr. Eric Berg',
    url: 'https://www.youtube.com/@DrEricBergDC',
    description: '10M+ subscribers, extensive fasting content',
  },
  {
    name: 'Thomas DeLauer',
    url: 'https://www.youtube.com/@ThomasDeLauerOfficial',
    description: 'Celebrity trainer, science-based fasting tips',
  },
  {
    name: 'What I\'ve Learned',
    url: 'https://www.youtube.com/@WhatIveLearned',
    description: 'Well-researched health documentaries',
  },
  {
    name: 'Dr. Sten Ekberg',
    url: 'https://www.youtube.com/@drekberg',
    description: 'Holistic health and intermittent fasting',
  },
];

const COMMUNITIES = [
  {
    name: 'r/intermittentfasting',
    url: 'https://www.reddit.com/r/intermittentfasting/',
    description: '2M+ members sharing fasting journeys',
    members: '2M+',
  },
  {
    name: 'r/fasting',
    url: 'https://www.reddit.com/r/fasting/',
    description: 'Extended and water fasting community',
    members: '500K+',
  },
  {
    name: 'r/OMAD',
    url: 'https://www.reddit.com/r/omad/',
    description: 'One Meal A Day community',
    members: '300K+',
  },
  {
    name: 'Fasting Facebook Groups',
    url: 'https://www.facebook.com/groups/intermittentfastinglifestyle/',
    description: 'Active communities on Facebook',
    members: '1M+',
  },
];

const BOOKS = [
  {
    name: 'The Complete Guide to Fasting',
    author: 'Dr. Jason Fung',
    url: 'https://www.amazon.com/Complete-Guide-Fasting-Intermittent-Alternate-Day/dp/1628600012',
    description: 'Comprehensive guide to all fasting protocols',
  },
  {
    name: 'The Obesity Code',
    author: 'Dr. Jason Fung',
    url: 'https://www.amazon.com/Obesity-Code-Unlocking-Secrets-Weight/dp/1771641258',
    description: 'Understanding insulin and weight loss',
  },
  {
    name: 'Fast. Feast. Repeat.',
    author: 'Gin Stephens',
    url: 'https://www.amazon.com/Fast-Feast-Repeat-Comprehensive-Intermittent/dp/1250757622',
    description: 'Practical guide to intermittent fasting lifestyle',
  },
  {
    name: 'Life in the Fasting Lane',
    author: 'Dr. Jason Fung, Eve Mayer, Megan Ramos',
    url: 'https://www.amazon.com/Life-Fasting-Lane-Intermittent-Transform/dp/0062969447',
    description: 'Real stories and practical advice',
  },
];

interface Article {
  id: string;
  title: string;
  description: string;
  category: 'Beginner' | 'Science' | 'Tips' | 'Nutrition';
  readTime: string;
  color: string;
  content: string[];
}

const ARTICLES: Article[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Intermittent Fasting',
    description: 'Everything you need to know to begin your fasting journey safely and effectively.',
    category: 'Beginner',
    readTime: '8 min read',
    color: '#22c55e',
    content: [
      `## What is Intermittent Fasting?`,
      `Intermittent fasting (IF) isn't a diet—it's an eating pattern. Instead of focusing on what you eat, it focuses on when you eat. By cycling between periods of eating and fasting, you give your body time to rest, repair, and burn stored energy.`,
      `## Popular Fasting Protocols`,
      `**16:8 Method (Most Popular)**
Fast for 16 hours, eat within an 8-hour window. For example, skip breakfast and eat between 12pm-8pm. This is the easiest protocol for beginners.`,
      `**18:6 Method**
A slightly more advanced version with an 18-hour fast and 6-hour eating window. Great once you've adapted to 16:8.`,
      `**20:4 Method (Warrior Diet)**
Fast for 20 hours with a 4-hour eating window. Usually one large meal plus snacks.`,
      `**OMAD (One Meal A Day)**
A 23:1 protocol where you eat all daily calories in a single meal. Advanced fasters only.`,
      `## How to Start`,
      `**Week 1: Delay breakfast by 2 hours.** If you normally eat at 7am, push it to 9am. This simple change starts training your body.`,
      `**Week 2: Skip breakfast entirely.** Have your first meal at noon. Drink water, black coffee, or plain tea in the morning.`,
      `**Week 3: Establish your window.** Aim for 16:8. Eat between 12pm-8pm (or whatever 8-hour window suits your schedule).`,
      `**Week 4 and beyond:** Fine-tune based on how you feel. Some people naturally progress to 18:6 or longer.`,
      `## What to Expect`,
      `**Days 1-3:** Hunger pangs, especially around your usual meal times. This is normal and temporary.`,
      `**Days 4-7:** Hunger starts to decrease. Your body is adapting to burning stored fat.`,
      `**Week 2+:** Mental clarity improves. Energy becomes more stable throughout the day.`,
      `**Month 1+:** Fasting feels natural. Many people report not wanting to go back to constant eating.`,
      `## What Breaks a Fast?`,
      `**Safe during fasting:** Water, black coffee, plain tea, sparkling water, electrolytes (no calories).`,
      `**Breaks your fast:** Any calories—food, milk in coffee, sugar, cream, diet sodas (controversial), supplements with calories.`,
      `## Safety First`,
      `Consult your doctor before starting if you: have diabetes, are pregnant or breastfeeding, have a history of eating disorders, take medications that require food, or are underweight.`,
      `## Key Takeaways`,
      `• Start slow—16:8 is perfect for beginners
• Stay hydrated during fasting windows
• Listen to your body and adjust as needed
• Consistency matters more than perfection
• Give yourself at least 2-3 weeks to adapt`,
    ],
  },
  {
    id: 'science-behind-fasting',
    title: 'The Science Behind Fasting',
    description: 'Understand what happens in your body during a fast, from ketosis to autophagy.',
    category: 'Science',
    readTime: '12 min read',
    color: '#3b82f6',
    content: [
      `## The Fed vs. Fasted State`,
      `Your body operates in two metabolic states: fed and fasted. Understanding these states is key to understanding why fasting works.`,
      `**Fed State (0-4 hours after eating)**
Your body is digesting and absorbing nutrients. Insulin is elevated, signaling cells to take up glucose for energy. Excess energy is stored as glycogen (in liver and muscles) and fat.`,
      `**Post-Absorptive State (4-12 hours)**
Digestion is complete. Blood sugar stabilizes. Your body starts tapping into glycogen stores. Insulin levels drop.`,
      `**Fasted State (12+ hours)**
Glycogen stores are depleting. Your body increasingly turns to fat for fuel. Ketone production begins. Cellular repair processes activate.`,
      `## Hour-by-Hour: What Happens When You Fast`,
      `**Hours 0-4: Digestion**
Blood sugar rises then falls. Insulin spikes to manage glucose. Energy comes from recently eaten food.`,
      `**Hours 4-8: Blood Sugar Stabilizes**
Stomach empties. Insulin returns to baseline. Body starts using stored glycogen. You might feel hungry as blood sugar dips.`,
      `**Hours 8-12: Fat Burning Begins**
Glycogen stores depleting. Liver starts converting fat to ketones. Growth hormone begins to rise. Mental clarity often improves.`,
      `**Hours 12-18: Ketosis**
Body significantly shifts to burning fat. Ketone levels rise measurably. Brain starts using ketones for fuel (20-30%). Autophagy begins.`,
      `**Hours 18-24: Deep Ketosis**
Fat burning is now the primary energy source. Autophagy accelerates. Growth hormone can increase up to 5x. Inflammation markers decrease.`,
      `**Hours 24-48: Enhanced Autophagy**
Cellular cleanup in full swing. Immune system begins regenerating. Insulin sensitivity significantly improved.`,
      `## Ketosis Explained`,
      `Ketosis is a metabolic state where your body burns fat instead of glucose for fuel. When glucose is scarce, your liver converts fatty acids into ketone bodies: beta-hydroxybutyrate (BHB), acetoacetate, and acetone.`,
      `Ketones are actually a more efficient fuel source for the brain—providing more ATP (energy) per unit than glucose. This is why many fasters report improved mental clarity and focus.`,
      `## Hormonal Changes`,
      `**Insulin:** Drops significantly during fasting, allowing fat cells to release stored energy. Low insulin = fat burning mode.`,
      `**Human Growth Hormone (HGH):** Can increase up to 5x during a 24-hour fast. Promotes fat burning, muscle preservation, and tissue repair.`,
      `**Norepinephrine:** Increases to mobilize fat stores and boost metabolic rate. This is why fasting doesn't slow your metabolism like calorie restriction.`,
      `**Cortisol:** Slightly elevated in the morning to mobilize energy. This is normal and actually helps with alertness.`,
      `## Autophagy: Cellular Recycling`,
      `Autophagy (literally "self-eating") is your body's cellular cleanup process. During fasting, cells break down damaged proteins, dysfunctional mitochondria, and other cellular debris—recycling them into new components.`,
      `This process is linked to longevity, reduced cancer risk, improved brain function, and protection against neurodegenerative diseases. Autophagy typically begins around 16-18 hours of fasting and increases significantly at 24+ hours.`,
      `## The Research`,
      `Studies have shown intermittent fasting can:
• Improve insulin sensitivity by 20-31%
• Reduce inflammation markers (CRP, IL-6)
• Increase brain-derived neurotrophic factor (BDNF)
• Extend lifespan in animal studies
• Improve cardiovascular health markers
• Support weight loss while preserving muscle mass`,
      `## Key Takeaways`,
      `• Fasting triggers a metabolic switch from glucose to fat burning
• Ketosis provides clean, efficient energy for brain and body
• Hormonal changes during fasting promote fat loss and cellular repair
• Autophagy is a powerful benefit that begins around 16-18 hours
• The longer you fast, the deeper the benefits—but even 16:8 is effective`,
    ],
  },
  {
    id: 'autophagy',
    title: "Autophagy: Your Body's Cellular Cleanup",
    description: 'Learn about the Nobel Prize-winning discovery of autophagy and how fasting triggers it.',
    category: 'Science',
    readTime: '10 min read',
    color: '#3b82f6',
    content: [
      `## The Nobel Prize Discovery`,
      `In 2016, Japanese scientist Yoshinori Ohsumi won the Nobel Prize in Physiology or Medicine for his discoveries of the mechanisms of autophagy. His work revealed how cells recycle their own components—a process essential for survival and health.`,
      `## What is Autophagy?`,
      `Autophagy comes from Greek words meaning "self-eating." It's your body's way of cleaning house at the cellular level. During autophagy, cells identify damaged or dysfunctional components—misfolded proteins, damaged mitochondria, cellular debris—and break them down into basic building blocks that can be reused.`,
      `Think of it as cellular recycling: out with the old and broken, in with fresh new components.`,
      `## Why Autophagy Matters`,
      `**Disease Prevention**
Dysfunctional autophagy is linked to cancer, neurodegeneration (Alzheimer's, Parkinson's), heart disease, and accelerated aging. When cellular cleanup fails, damaged components accumulate and cause problems.`,
      `**Brain Health**
Autophagy clears the protein aggregates associated with neurodegenerative diseases. It also promotes neuroplasticity and the growth of new brain cells.`,
      `**Longevity**
Every long-lived species studied shows robust autophagy. It's considered one of the key mechanisms behind the life-extending effects of caloric restriction and fasting.`,
      `**Immune Function**
Autophagy helps immune cells function properly and can even destroy intracellular pathogens like bacteria and viruses.`,
      `## How Fasting Triggers Autophagy`,
      `Autophagy is primarily regulated by nutrient-sensing pathways:`,
      `**mTOR (mechanistic target of rapamycin)**
When you eat, especially protein, mTOR is activated. mTOR promotes growth and building—but suppresses autophagy. During fasting, mTOR activity drops, allowing autophagy to proceed.`,
      `**AMPK (AMP-activated protein kinase)**
AMPK is your cellular energy sensor. When energy is low (during fasting), AMPK activates and triggers autophagy to recycle cellular components for energy.`,
      `**Insulin**
High insulin suppresses autophagy. Fasting lowers insulin, removing this brake on cellular cleanup.`,
      `## When Does Autophagy Begin?`,
      `Autophagy is always happening at low levels, but fasting significantly upregulates it:`,
      `• **12-16 hours:** Autophagy begins to increase
• **18-24 hours:** Significant autophagy activity
• **24-48 hours:** Autophagy peaks
• **48+ hours:** Very high autophagy, but benefits plateau`,
      `For most people, regular 16-24 hour fasts provide meaningful autophagy benefits without extreme protocols.`,
      `## Signs of Autophagy`,
      `You can't directly feel autophagy, but signs that it's working include:
• Improved mental clarity
• Reduced inflammation and joint pain
• Better skin (autophagy clears damaged skin cells)
• Increased energy after the initial adaptation
• Reduced cravings`,
      `## Maximizing Autophagy`,
      `**Fast longer (occasionally)**
While 16:8 triggers some autophagy, occasional 24-36 hour fasts provide deeper benefits.`,
      `**Exercise while fasted**
Exercise activates AMPK, which further stimulates autophagy. Fasted morning workouts can be particularly effective.`,
      `**Avoid snacking**
Even small amounts of food—especially protein—activate mTOR and suppress autophagy. Clean fasts are essential.`,
      `**Consider coffee**
Coffee (black, no calories) may actually enhance autophagy through its effects on AMPK and other pathways.`,
      `**Sleep well**
Autophagy is enhanced during sleep. Poor sleep impairs cellular cleanup.`,
      `## Key Takeaways`,
      `• Autophagy is essential cellular maintenance that clears damaged components
• It's linked to longevity, brain health, and disease prevention
• Fasting is one of the most powerful ways to stimulate autophagy
• Significant autophagy begins around 16-18 hours of fasting
• Regular intermittent fasting provides meaningful autophagy benefits`,
    ],
  },
  {
    id: 'tips-for-success',
    title: '10 Tips for a Successful Fast',
    description: 'Practical advice to help you complete your fasts and build a sustainable practice.',
    category: 'Tips',
    readTime: '6 min read',
    color: '#f59e0b',
    content: [
      `## 1. Start Gradually`,
      `Don't jump into 24-hour fasts on day one. Start with 12 hours, then 14, then 16. Let your body adapt. Rushing leads to burnout and giving up.`,
      `## 2. Stay Hydrated`,
      `Drink plenty of water during your fast. Many hunger pangs are actually thirst signals. Aim for at least 8 glasses. Add a pinch of salt if you feel lightheaded—electrolytes matter.`,
      `## 3. Keep Busy`,
      `Boredom is the enemy of fasting. The busier you are, the less you think about food. Schedule your fasting hours during work or activities. Many people find fasting on busy weekdays easier than weekends.`,
      `## 4. Black Coffee is Your Friend`,
      `Coffee suppresses appetite and boosts metabolism. It may also enhance autophagy. Just keep it black—no cream, milk, or sugar. Tea works too.`,
      `## 5. Plan Your Eating Window`,
      `Know exactly when you'll break your fast and what you'll eat. This prevents impulsive decisions and overeating. Preparation removes willpower from the equation.`,
      `## 6. Don't Compensate by Overeating`,
      `The goal isn't to eat the same calories in a shorter window. Eat until satisfied, not stuffed. Listen to your body's fullness signals. If you overeat during your window, you'll negate the benefits.`,
      `## 7. Prioritize Protein`,
      `When you do eat, make protein a priority. It's the most satiating macronutrient and essential for maintaining muscle mass. Aim for 0.7-1g per pound of body weight daily.`,
      `## 8. Expect an Adjustment Period`,
      `The first 1-2 weeks are the hardest. Hunger comes in waves—it peaks and passes. Your body is learning to access stored fat. Push through the adaptation phase and it gets much easier.`,
      `## 9. Be Flexible, Not Perfect`,
      `Life happens. If you break a fast early, don't beat yourself up. One imperfect day doesn't erase progress. Consistency over time matters more than perfection.`,
      `## 10. Track Your Progress`,
      `Use an app (like Fast!) to log your fasts. Seeing your streak grow is motivating. Journal how you feel—energy, mood, hunger. This data helps you optimize your approach.`,
      `## Bonus: Sleep Counts`,
      `Most of your fasting hours should be while you sleep. Stop eating 3 hours before bed, sleep 8 hours, and you wake up with 11 hours already done. Fasting while sleeping is effortless.`,
      `## Key Takeaways`,
      `• Start slow and build up gradually
• Stay hydrated and use coffee/tea strategically
• Keep busy during fasting hours
• Plan your meals and prioritize protein
• Be consistent, not perfect
• Track your fasts to stay motivated`,
    ],
  },
  {
    id: 'breaking-your-fast',
    title: 'How to Break Your Fast Properly',
    description: 'What to eat after fasting to maximize benefits and avoid digestive issues.',
    category: 'Nutrition',
    readTime: '7 min read',
    color: '#06b6d4',
    content: [
      `## Why It Matters`,
      `How you break your fast affects how you feel and the benefits you get. After fasting, your digestive system is in a rested state. Bombarding it with the wrong foods can cause bloating, cramping, and energy crashes.`,
      `## The Shorter the Fast, the Less It Matters`,
      `**16-hour fasts:** You can generally eat normally. Your digestive system hasn't significantly changed. Just don't gorge yourself.`,
      `**18-24 hour fasts:** Be a bit more mindful. Start with something light, then eat your main meal 30-60 minutes later.`,
      `**24+ hour fasts:** Take more care. Start with easily digestible foods. Give your system time to "wake up."`,
      `## Best Foods to Break a Fast`,
      `**Bone broth**
Gentle on the stomach, rich in electrolytes and minerals. Perfect for longer fasts.`,
      `**Eggs**
Easy to digest protein. Scrambled or soft-boiled are gentler than fried.`,
      `**Avocado**
Healthy fats that won't spike blood sugar. Filling and nutritious.`,
      `**Cooked vegetables**
Steamed or sautéed veggies are easier to digest than raw. Good fiber for gut health.`,
      `**Greek yogurt**
Protein-rich and contains probiotics. Choose plain, full-fat versions.`,
      `**Fish**
Light protein that's easy to digest. Salmon, cod, or tilapia work well.`,
      `## Foods to Avoid When Breaking a Fast`,
      `**High-sugar foods**
Candy, pastries, fruit juice. These spike blood sugar rapidly after a fast, leading to crashes and cravings.`,
      `**Processed foods**
Chips, fast food, packaged snacks. Hard on a rested digestive system and provide poor nutrition.`,
      `**Large amounts of raw vegetables**
Salads are healthy but can cause bloating when breaking longer fasts. Cook your veggies instead.`,
      `**Dairy (for some people)**
Lactose can be harder to digest after fasting. Start with fermented dairy like yogurt if you include dairy.`,
      `**Nuts in large quantities**
High in fiber and fat, which can cause digestive distress. A small handful is fine.`,
      `## A Sample Break-Fast Meal`,
      `**For 16:8 fasts:**
Scrambled eggs with avocado and sautéed spinach. Add some berries on the side.`,
      `**For 24-hour fasts:**
Start with a cup of bone broth. Wait 30 minutes. Then have grilled fish with steamed vegetables and olive oil.`,
      `**For 36+ hour fasts:**
Break with bone broth or a small serving of scrambled eggs. Wait 1-2 hours. Then have a normal-sized meal with protein, vegetables, and healthy fats.`,
      `## Listen to Your Body`,
      `Everyone's different. Pay attention to how foods make you feel. If something causes bloating or discomfort, try a different approach next time. Keep notes on what works best for you.`,
      `## Common Mistakes`,
      `• Breaking with a huge meal (overloads digestion)
• Eating too fast (chew thoroughly!)
• Choosing convenience over quality
• Drinking alcohol on an empty stomach
• Ignoring hunger and eating on a schedule rather than when ready`,
      `## Key Takeaways`,
      `• The longer the fast, the more careful you should be
• Start with easily digestible foods—eggs, broth, avocado
• Avoid sugar, processed foods, and large raw salads
• Eat slowly and chew thoroughly
• Listen to your body and adjust based on experience`,
    ],
  },
  {
    id: 'common-mistakes',
    title: 'Common Fasting Mistakes to Avoid',
    description: "Learn from others' mistakes and set yourself up for fasting success.",
    category: 'Tips',
    readTime: '8 min read',
    color: '#f59e0b',
    content: [
      `## Mistake #1: Starting Too Aggressively`,
      `Jumping straight into 24-hour or multi-day fasts sets you up for failure. Your body needs time to adapt to using fat for fuel. Start with 12-14 hour fasts for a week, then gradually extend.`,
      `**The fix:** Begin with 16:8 and master it before trying longer protocols.`,
      `## Mistake #2: Not Drinking Enough Water`,
      `Dehydration causes headaches, fatigue, and false hunger signals. Many people don't realize how much water they normally get from food.`,
      `**The fix:** Drink at least 8-10 glasses of water during fasting hours. Add electrolytes for longer fasts.`,
      `## Mistake #3: Dirty Fasting`,
      `Adding cream to coffee, drinking diet sodas, or having "just a little snack" breaks your fast. Even small amounts of calories or artificial sweeteners can trigger insulin and halt fat burning.`,
      `**The fix:** Keep it clean. Water, black coffee, plain tea—that's it.`,
      `## Mistake #4: Overeating During Eating Windows`,
      `Treating your eating window as a free-for-all negates the caloric benefit of fasting and can cause digestive issues. "I fasted so I can eat whatever" is a trap.`,
      `**The fix:** Eat until satisfied, not stuffed. Focus on nutrient-dense foods.`,
      `## Mistake #5: Ignoring Electrolytes`,
      `When you fast, you excrete more sodium and other electrolytes. This can cause headaches, muscle cramps, and fatigue—often mistaken for hunger.`,
      `**The fix:** Add a pinch of salt to your water. Consider potassium and magnesium supplements for longer fasts.`,
      `## Mistake #6: Exercising Too Hard While Adapting`,
      `Intense workouts while your body is still learning to burn fat efficiently can leave you exhausted and miserable. Save the hard training for when you're adapted.`,
      `**The fix:** Light exercise (walking, yoga) during the first 2-3 weeks. Resume normal training once adapted.`,
      `## Mistake #7: Inconsistent Fasting Windows`,
      `Eating at 12pm one day and 8am the next confuses your circadian rhythm. Your body thrives on consistency. Irregular patterns make fasting feel harder.`,
      `**The fix:** Keep your eating window consistent, at least on weekdays. Your body will adapt and hunger will align with your schedule.`,
      `## Mistake #8: Not Getting Enough Sleep`,
      `Sleep deprivation increases ghrelin (hunger hormone) and decreases leptin (satiety hormone). Poor sleep makes fasting much harder and reduces benefits.`,
      `**The fix:** Prioritize 7-9 hours of quality sleep. Stop eating 3+ hours before bed.`,
      `## Mistake #9: Obsessing Over the Clock`,
      `Staring at the countdown timer makes time crawl. The more you focus on hunger, the more intense it feels.`,
      `**The fix:** Stay busy. Set a timer and forget about it. Check the Fast! app occasionally, not constantly.`,
      `## Mistake #10: Giving Up Too Soon`,
      `The first week is the hardest. Many people quit right before it gets easier. Your body needs 1-2 weeks to adapt to burning fat efficiently.`,
      `**The fix:** Commit to at least 2-3 weeks before deciding if fasting is for you. The adaptation period is temporary.`,
      `## Mistake #11: Not Tracking Progress`,
      `Without data, you can't see patterns or improvements. Was today harder because you slept poorly? Ate junk yesterday? You won't know without records.`,
      `**The fix:** Log your fasts, rate your energy, note what you ate. Use this data to optimize.`,
      `## Mistake #12: Making It Too Complicated`,
      `Tracking macros, calculating ketones, timing supplements perfectly—analysis paralysis kills consistency. Keep it simple, especially starting out.`,
      `**The fix:** Focus on one thing: not eating for X hours. That's it. Advanced optimization can come later.`,
      `## Key Takeaways`,
      `• Start slow and stay consistent
• Hydrate and mind your electrolytes
• Keep fasts clean—no sneaky calories
• Eat well during your window, don't binge
• Give yourself time to adapt before judging results
• Simple and sustainable beats complicated and perfect`,
    ],
  },
];

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const categoryColors: Record<string, string> = {
    Beginner: '#22c55e',
    Science: '#3b82f6',
    Tips: '#f59e0b',
    Nutrition: '#06b6d4',
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: 24,
        background: '#fff',
        borderRadius: 16,
        textDecoration: 'none',
        border: '1px solid #e5e5e5',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = article.color;
        e.currentTarget.style.boxShadow = `0 4px 12px ${article.color}25`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e5e5';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          padding: '4px 10px',
          background: `${categoryColors[article.category]}15`,
          color: categoryColors[article.category],
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
        }}>
          {article.category}
        </span>
        <span style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> {article.readTime}
        </span>
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
        {article.title}
      </h3>
      <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>
        {article.description}
      </p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        color: article.color,
        fontSize: 14,
        fontWeight: 600,
      }}>
        Read article <ChevronRight size={16} />
      </div>
    </button>
  );
}

function ArticleModal({ article, onClose }: { article: Article; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 200,
      overflow: 'auto',
    }}>
      <div style={{
        maxWidth: 700,
        margin: '40px auto',
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid #e5e5e5',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              padding: '4px 10px',
              background: `${article.color}15`,
              color: article.color,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {article.category}
            </span>
            <span style={{ fontSize: 13, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={14} /> {article.readTime}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#f5f5f5',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 28px 48px' }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#1a1a1a',
            margin: '0 0 12px',
            lineHeight: 1.2,
          }}>
            {article.title}
          </h1>
          <p style={{
            fontSize: 18,
            color: '#666',
            margin: '0 0 32px',
            lineHeight: 1.5,
          }}>
            {article.description}
          </p>

          <div style={{ fontSize: 16, lineHeight: 1.8, color: '#333' }}>
            {article.content.map((block, i) => {
              // Check if it's a heading
              if (block.startsWith('## ')) {
                return (
                  <h2 key={i} style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    margin: i === 0 ? '0 0 16px' : '32px 0 16px',
                  }}>
                    {block.replace('## ', '')}
                  </h2>
                );
              }
              // Regular paragraph - handle bold and line breaks
              return (
                <p key={i} style={{ margin: '0 0 16px', whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{
                    __html: block
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/• /g, '<span style="color: #22c55e; margin-right: 8px;">•</span>')
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          textAlign: 'center',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 16px', fontSize: 15 }}>
            Ready to put this knowledge into practice?
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#fff',
              color: '#16a34a',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Start Your Fast Now
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResourceSection({ title, icon: Icon, color, children }: {
  title: string;
  icon: any;
  color: string;
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ResourceCard({ name, url, description, extra }: {
  name: string;
  url: string;
  description: string;
  extra?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        padding: 20,
        background: '#fff',
        borderRadius: 12,
        textDecoration: 'none',
        border: '1px solid #e5e5e5',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#22c55e';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e5e5';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
            {name}
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: '#666', lineHeight: 1.5 }}>
            {description}
          </p>
          {extra && (
            <span style={{
              display: 'inline-block',
              marginTop: 8,
              padding: '4px 8px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: 6,
              fontSize: 12,
              color: '#16a34a',
              fontWeight: 500,
            }}>
              {extra}
            </span>
          )}
        </div>
        <ExternalLink size={16} color="#999" style={{ flexShrink: 0, marginTop: 4 }} />
      </div>
    </a>
  );
}

export function Resources() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        padding: '20px 24px',
        background: '#fff',
        borderBottom: '1px solid #e5e5e5',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1000,
          margin: '0 auto',
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <Flame size={28} color="#22c55e" />
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Fast!</span>
          </Link>
          <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link to="/community" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Community</Link>
            <Link to="/blog" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>Blog</Link>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#22c55e',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 500,
            }}>
              <ArrowLeft size={16} /> Start Fasting
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.08) 0%, transparent 100%)',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 16px', color: '#1a1a1a' }}>
            Fasting Resources
          </h1>
          <p style={{ fontSize: 18, color: '#666', margin: 0, lineHeight: 1.6 }}>
            Curated collection of the best fasting apps, science, experts, communities, and books to support your intermittent fasting journey.
          </p>
        </div>
      </section>

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      {/* Resources */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Articles Section - First */}
        <ResourceSection title="Articles & Guides" icon={FileText} color="#8b5cf6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {ARTICLES.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => setSelectedArticle(article)}
              />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Fasting Apps" icon={Smartphone} color="#22c55e">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {FASTING_APPS.map((app, i) => (
              <ResourceCard key={i} name={app.name} url={app.url} description={app.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Scientific Research" icon={Microscope} color="#3b82f6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {SCIENCE_RESOURCES.map((resource, i) => (
              <ResourceCard key={i} name={resource.name} url={resource.url} description={resource.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Expert Content" icon={GraduationCap} color="#8b5cf6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {EXPERT_CONTENT.map((expert, i) => (
              <ResourceCard key={i} name={expert.name} url={expert.url} description={expert.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="YouTube Channels" icon={Youtube} color="#ef4444">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {YOUTUBE_CHANNELS.map((channel, i) => (
              <ResourceCard key={i} name={channel.name} url={channel.url} description={channel.description} />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Communities" icon={Users} color="#f59e0b">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {COMMUNITIES.map((community, i) => (
              <ResourceCard
                key={i}
                name={community.name}
                url={community.url}
                description={community.description}
                extra={community.members}
              />
            ))}
          </div>
        </ResourceSection>

        <ResourceSection title="Books" icon={BookOpen} color="#06b6d4">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {BOOKS.map((book, i) => (
              <ResourceCard
                key={i}
                name={book.name}
                url={book.url}
                description={book.description}
                extra={`by ${book.author}`}
              />
            ))}
          </div>
        </ResourceSection>

      </div>

      {/* CTA */}
      <section style={{
        padding: '60px 24px',
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 16px' }}>
          Ready to track your fasts?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 24px', fontSize: 16 }}>
          Fast! makes it simple to track your fasting progress with milestone education and journaling.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            background: '#fff',
            color: '#16a34a',
            borderRadius: 10,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Start Your Free Fast
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 24px',
        background: '#1a1a1a',
        color: '#999',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <Flame size={20} color="#22c55e" />
          <span style={{ color: '#fff', fontWeight: 600 }}>Fast!</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, fontSize: 14 }}>
          <Link to="/resources" style={{ color: '#999', textDecoration: 'none' }}>Resources</Link>
          <Link to="/community" style={{ color: '#999', textDecoration: 'none' }}>Community</Link>
          <Link to="/blog" style={{ color: '#999', textDecoration: 'none' }}>Blog</Link>
        </div>
        <p style={{ margin: 0, fontSize: 13 }}>
          © {new Date().getFullYear()} Fast! All rights reserved.
        </p>
      </footer>
    </div>
  );
}
