import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { ComplaintPriority } from '@/data/types';

export class EmergencyPredictor {
    private model: mobilenet.MobileNet | null = null;
    public isModelLoading: boolean = false;

    public async init() {
        if (this.model || this.isModelLoading) return;
        this.isModelLoading = true;
        try {
            await tf.ready();
            // Load the MobileNet model (a standard pretrained image classification model)
            this.model = await mobilenet.load({ version: 2, alpha: 1.0 });
            console.log('Pretrained AIML Model (MobileNet) loaded successfully for emergency priority classification');
        } catch (e) {
            console.error('Failed to load pretrained ML model', e);
        } finally {
            this.isModelLoading = false;
        }
    }

    // Pre-trained keywords (NLP feature extraction component)
    private readonly emergencyKeywords = [
        "leak", "pipeline leak", "leakage", "gushing", "burst", "water supply", "spraying", // pipeline 
        "electric pole", "wire", "shock", "sparking", "current", "live wire", "transformer", "downed", // electric
        "structural", "collapse", "falling", "crack", "building down", "wall", "roof", "hazard", "bridge", // structural
        "danger", "urgent", "fire", "flood", "accident", "emergency", "blast", "explosion", "sewage overflow" // general
    ];

    // Map ImageNet classes that MobileNet outputs to possible emergency/infrastructure indicators
    private readonly emergencyImageClasses = [
        "fountain", "geyser", "breakwater", "dam", "water", // pipeline leakage visual hints
        "pole", "street sign", "traffic light", "crane", // electric pole/infrastructure damage visual hints
        "chainlink fence", "wreck", "cliff", "valley", "volcano", "chain", "wall", "truck" // structural emergency visual hints
    ];

    public async predictPriority(description: string, category: string, imageSrc: string | null): Promise<ComplaintPriority> {
        let emergencyScore = 0;
        const textContext = (description + " " + category).toLowerCase();

        // 1. NLP Analysis
        const hasEmergencyText = this.emergencyKeywords.some(keyword => textContext.includes(keyword));
        if (hasEmergencyText) {
            emergencyScore += 5; // Strong emergency semantic indicators
        } else if (textContext.includes("broken") || textContext.includes("garbage") || textContext.includes("stuck") || textContext.includes("pothole")) {
            emergencyScore += 2; // Medium semantic indicators
        }

        // 2. Pretrained Computer Vision Analysis
        if (this.model && imageSrc) {
            try {
                const imageEl = new Image();
                imageEl.crossOrigin = "anonymous";
                imageEl.src = imageSrc;

                // Wait for the simulated image element to load the user's uploaded image preview
                await new Promise((resolve, reject) => {
                    imageEl.onload = resolve;
                    imageEl.onerror = reject;
                });

                // Run inference
                const predictions = await this.model.classify(imageEl, 5); // top 5 predictions
                console.log("AIML Model image predictions:", predictions);

                const hasEmergencyVisuals = predictions.some(p => {
                    const className = p.className.toLowerCase();
                    // We check if the probability is decently high to rely on it
                    const isConfident = p.probability > 0.15;

                    if (!isConfident) return false;

                    return this.emergencyImageClasses.some(emClass => className.includes(emClass)) ||
                        className.includes("fire") ||
                        (className.includes("water") && textContext.includes("leak")) || // Only emergency if water + leak context
                        (className.includes("pole") && textContext.includes("electric")); // Only emergency if pole + electric context
                });

                if (hasEmergencyVisuals) {
                    console.log("Pretrained vision model confidently detected infrastructure hazard features.");
                    emergencyScore += 3; // Reduced from 4 to balance with text
                }
            } catch (err) {
                console.warn("Pretrained AIML Image classification error. Falling back to text layer.", err);
            }
        }

        // 3. Final Decision Logic
        // E.g., pipeline leakage + water image = 9 -> high
        // pipeline leakage without image = 5 -> high
        // pothole without image = 2 -> medium
        // random text without image = 0 -> low
        console.log(`Pretrained Model evaluation complete. Final Score: ${emergencyScore}`);

        // A score of 5 or more dictates a true 'high' priority emergency
        if (emergencyScore >= 5) {
            return "high";
        } else if (emergencyScore >= 2) {
            return "medium";
        }

        return "low";
    }
}

export const pretrainedEmergencyAI = new EmergencyPredictor();
