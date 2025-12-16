interface LoadingProgressProps {
    assetType: 'person' | 'composite' | 'video';
    mode?: 'FAST' | 'STANDARD';
    startTime: number;
}
export declare function LoadingProgress({ assetType, mode, startTime }: LoadingProgressProps): import("react").JSX.Element;
export {};
