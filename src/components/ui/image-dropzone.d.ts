interface ImageDropzoneProps {
    onImageSelect: (file: File) => void;
    currentImageUrl?: string;
    onClearImage?: () => void;
    disabled?: boolean;
    maxSizeMB?: number;
    label?: string;
    aspectRatio?: string;
}
export declare function ImageDropzone({ onImageSelect, currentImageUrl, onClearImage, disabled, maxSizeMB, label, aspectRatio, }: ImageDropzoneProps): import("react").JSX.Element;
export {};
