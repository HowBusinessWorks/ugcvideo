export declare const userMenuItems: readonly [{
    readonly name: "Video Generator";
    readonly to: "/generate";
    readonly icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    readonly isAdminOnly: false;
    readonly isAuthRequired: true;
}, {
    readonly name: "Account Settings";
    readonly to: "/account";
    readonly icon: import("react").ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & import("react").RefAttributes<SVGSVGElement>>;
    readonly isAuthRequired: false;
    readonly isAdminOnly: false;
}];
