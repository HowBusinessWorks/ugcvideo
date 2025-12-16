export declare const PhotoGallery: ({ animationDelay, }: {
    animationDelay?: number;
}) => import("react").JSX.Element;
type Direction = "left" | "right";
export declare const Photo: ({ videoSrc, text, alt, className, direction, width, height, ...props }: {
    videoSrc: string;
    text: string;
    alt: string;
    className?: string;
    direction?: Direction;
    width: number;
    height: number;
}) => import("react").JSX.Element;
export {};
