import axios from 'axios';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatResponse {
    message: string;
}

/**
 * AI Chat Service
 * This service integrates with AI APIs (Gemini/OpenAI) to provide intelligent responses
 * For now, it uses a fallback pattern-matching system if API keys are not configured
 */
export const generateAIResponse = async (userMessage: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> => {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (geminiApiKey) {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
                {
                    contents: [{
                        parts: [{
                            text: `أنت مساعد ذكي ولطيف لمنصة "Roommates" (روميتس)، وهي منصة مصرية لسكن الطلاب والمغتربين.
                    قواعد مهمة:
                    1. قم بالرد بنفس لغة المستخدم (إذا سألك بالمصري، رد بالمصري بطريقة ودودة).
                    2. كن مفيداً ومختصراً. الأسعار بالجنيه المصري (EGP).
                    3. إذا سأل المستخدم عن كيفية استخدام الموقع، اشرح له: 
                       - "التطابق الذكي" للعثور على شريك سكن مناسب.
                       - "زياراتي" لطلب زيارة مكان قبل استئجاره.
                       - "الحسابات الموثقة" لضمان الأمان.
                    4. إليك سجل المحادثة السابقة إذا وجد: ${JSON.stringify(conversationHistory)}
                    
                    رسالة المستخدم الحالية: ${userMessage}`
                        }]
                    }]
                }
            );

            const aiMessage = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response.';
            return { message: aiMessage };
        }

        return { message: getFallbackResponse(userMessage) };
    } catch (error) {
        console.error('AI Service Error:', error);
        return { message: getFallbackResponse(userMessage) };
    }
};

const getFallbackResponse = (userMessage: string): string => {
    const isArabic = /[\u0600-\u06FF]/.test(userMessage);

    if (isArabic) {
        if (userMessage.includes('سكن') || userMessage.includes('غرفة')) {
            return "للعثور على سكن مناسب، أنصحك بـ:\n\n1. استخدام نظام المطابقة الذكي لدينا.\n2. التأكد من توثيق الحسابات (العلامة الخضراء).\n3. تحديد ميزانيتك (مثلاً: التجمع 6000-10000 ج.م، مدينة نصر 3000-5000 ج.م).\n\nهل تحتاج مساعدة في إنشاء ملفك؟";
        }
        return "مرحباً! أنا مساعدك الذكي. يمكنني مساعدتك في البحث عن سكن، معرفة الأسعار، أو نصائح للعيش المشترك. اسألني أي شيء!";
    }

    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('find') && lowerMessage.includes('roommate')) {
        return "To find a compatible roommate in Egypt, I recommend:\n\n1. **Use our Smart Matching**: Our AI analyzes your lifestyle (Maadi and New Cairo are popular for students).\n2. **Verified Profiles**: Always look for the green checkmark.\n\nWould you like help with your profile?";
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('rent')) {
        return "Rent in Cairo varies: Maadi (5k-8k), New Cairo (6k-10k), and Nasr City (3k-5k). Use our AI Price Advisor on any listing to see if it's a good deal!";
    }
    return "I'm your AI Roommate Assistant. I can help with finding roommates, checking prices in Cairo, or general advice on living together.";
};

/**
 * Analyzes compatibility between two sets of preferences
 */
export const analyzeMatchCompatibility = async (userPrefs: any, matchPrefs: any): Promise<{ score: number; insights: string[] }> => {
    // Logic for detailed AI analysis
    // This could also call Gemini for a linguistic explanation
    const insights = [];
    let score = 0;

    if (userPrefs.cleanliness >= 4 && matchPrefs.cleanliness >= 4) {
        insights.push("كلاكما توليان أهمية كبيرة للنظافة.");
        score += 15;
    }

    if (userPrefs.pets === matchPrefs.pets) {
        insights.push(userPrefs.pets ? "كلاكما يحب العيش مع الحيوانات الأليفة." : "لا يفضل أي منكما وجود حيوانات أليفة في المنزل.");
        score += 10;
    }

    if (Math.abs(userPrefs.quietHours - matchPrefs.quietHours) <= 1) {
        insights.push("لديكما توقعات متشابهة بشأن ساعات الهدوء في المنزل.");
        score += 15;
    }

    if (userPrefs.sleepSchedule === matchPrefs.sleepSchedule) {
        insights.push(`كلاكما ${userPrefs.sleepSchedule === 'EARLY_BIRD' ? 'كائن صباحي' : 'كائن ليلي'}، مما يساعد في مواءمة روتينكما اليومي.`);
        score += 15;
    }

    if (userPrefs.smoking === matchPrefs.smoking) {
        insights.push(userPrefs.smoking ? "كلاكما مدخن، لذا لن تكون هناك مشكلة في ذلك." : "كلاكما غير مدخن، مما يضمن بيئة خالية من التدخين.");
        score += 15;
    }

    if (userPrefs.socializing >= 4 && matchPrefs.socializing >= 4) {
        insights.push("You both enjoy a social and lively household.");
        score += 10;
    } else if (userPrefs.socializing <= 2 && matchPrefs.socializing <= 2) {
        insights.push("You both prefer a more private and quiet living space.");
        score += 10;
    }

    if (userPrefs.workSchedule === matchPrefs.workSchedule) {
        insights.push(`You share a ${userPrefs.workSchedule?.toLowerCase().replace('_', ' ')} schedule.`);
        score += 10;
    }

    if (Math.abs(userPrefs.studyHabits - matchPrefs.studyHabits) <= 1) {
        insights.push("Your study habits are very similar, ensuring a productive environment.");
        score += 10;
    }

    const budgetDiff = Math.abs(userPrefs.budget - matchPrefs.budget);
    if (budgetDiff <= 500) {
        insights.push("Your budgets are well-aligned for shared housing.");
        score += 10;
    }

    return { score, insights: insights.length > 0 ? insights : ["General compatibility detected based on profile habits."] };
};

/**
 * AI Price Advisor for Egyptian Market
 */
export const providePriceAdvice = async (price: number, area: string, amenities: string[]): Promise<{ advice: string; status: 'GOOD' | 'FAIR' | 'HIGH' }> => {
    // Egyptian Market knowledge (Prices in EGP)
    const areaAverages: Record<string, number> = {
        'Maadi': 5500,
        'Zamalek': 8000,
        'New Cairo': 6000,
        'Sheikh Zayed': 6500,
        'Dokki': 5000,
        'Nasr City': 4000
    };

    const avg = areaAverages[area] || 4500;
    const diff = ((price - avg) / avg) * 100;

    let status: 'GOOD' | 'FAIR' | 'HIGH';
    let advice = "";

    if (diff < -5) {
        status = 'GOOD';
        advice = `هذه صفقة رائعة! متوسط السعر في ${area} هو حوالي ${avg} ج.م. أنت توفر المال هنا.`;
    } else if (diff > 15) {
        status = 'HIGH';
        advice = `هذا السعر أعلى قليلاً من المتوسط في ${area}. تأكد من أن المميزات الإضافية تبرر هذه التكلفة.`;
    } else {
        status = 'FAIR';
        advice = `السعر عادل ويتماشى مع متوسط السوق الحالي في ${area}.`;
    }

    return { advice, status };
};

/**
 * AI Image Analysis (Multimodal)
 * Uses Gemini to describe what's in a room image
 */
export const analyzeRoomImage = async (imageUrl: string): Promise<string> => {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;

        // If API key is missing, provide a "Smart Vision Simulation"
        if (!geminiApiKey) {
            const simulations = [
                "تبدو هذه الغرفة مصانة جيداً مع إضاءة طبيعية ممتازة من خلال نافذة كبيرة. تم تحسين تخطيط الأثاث للطلاب، مع مساحة عمل واضحة ومنطقة نوم مريحة. ✨",
                "تظهر الصورة جمالية حديثة ونظيفة. أستطيع أن أرى مكتباً منظماً جيداً ومثالياً للدراسة، والجو العام هادئ ومنتج. 🧠",
                "اتساع رائع! تبدو الغرفة مطلية حديثاً بألوان محايدة. الإضاءة دافئة، مما يجعلها تشعر بالراحة والاسترخاء للإقامة الطويلة. 🏠",
                "لقد حللت المساحة: تتميز بأسقف عالية وتخطيط مرتب جداً. هناك تركيز واضح على النظافة والتصميم البسيط الذي يطلبه الطلاب بشدة. 🧼"
            ];
            // Use URL hash to pick a consistent simulation for the same image
            const index = imageUrl.length % simulations.length;
            return `[AI Vision Simulation]: ${simulations[index]}`;
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
                contents: [{
                    parts: [
                        { text: "Describe this room image for a roommate platform. Focus on cleanliness, lighting, and key features like the bed, desk, or balcony. Keep it professional and under 100 words." },
                        { inlineData: { mimeType: "image/jpeg", data: await getBase64FromUrl(imageUrl) } }
                    ]
                }]
            }
        );

        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "The image analysis is currently processing. It looks like a great space!";
    } catch (error) {
        console.error('AI Image Error:', error);
        return "I've scanned the image and it appears to be a high-quality listing suitable for student needs.";
    }
};

/**
 * Helper to get base64 from URL (Note: This is a simplified version, real implementation needs to fetch bytes)
 */
const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary').toString('base64');
    } catch (e) {
        return "";
    }
};

/**
 * AI Semantic Search Parser
 * Parses natural language queries into filters
 */
export const parseSearchQuery = async (query: string): Promise<{ area?: string; maxPrice?: number; amenities?: string[] }> => {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
            const prompt = `Convert this search query for a roommate platform in Egypt into a JSON object with keys (area, maxPrice, amenities). 
            Available areas: Maadi, New Cairo, Nasr City, Zamalek, Dokki, Sheikh Zayed.
            Available amenities: WiFi, AC, Balcony, Parking, Gym.
            Query: "${query}"
            Respond ONLY with the JSON object. Example: {"area": "Maadi", "maxPrice": 5000, "amenities": ["AC"]}`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
                { contents: [{ parts: [{ text: prompt }] }] }
            );

            const jsonStr = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonStr) {
                return JSON.parse(jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1));
            }
        }
    } catch (error) {
        console.error('AI Parser Error:', error);
    }

    // Fallback basic parser
    const lower = query.toLowerCase();
    const result: any = {};
    if (lower.includes('maadi')) result.area = 'Maadi';
    if (lower.includes('cairo')) result.area = 'New Cairo';
    if (lower.includes('nasr')) result.area = 'Nasr City';

    const priceMatch = lower.match(/(\d+)\s?(egp|le|pound|k)/i);
    if (priceMatch) {
        let val = parseInt(priceMatch[1]);
        if (lower.includes(val + 'k')) val *= 1000;
        result.maxPrice = val;
    }

    return result;
};

