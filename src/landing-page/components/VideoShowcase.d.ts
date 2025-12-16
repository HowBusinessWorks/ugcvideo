interface VideoExample {
    id: number;
    title: string;
    referenceImage: string;
    prompt: string;
    videoSrc: string;
    description: string;
}
interface VideoShowcaseProps {
    examples: VideoExample[];
}
declare const VideoShowcase: ({ examples }: VideoShowcaseProps) => import("react").JSX.Element;
export default VideoShowcase;
