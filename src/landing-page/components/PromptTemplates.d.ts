export interface PromptTemplate {
    id: string;
    category: string;
    icon?: React.ReactNode;
    title: string;
    prompt: string;
    description: string;
    personSettings?: {
        gender: string;
        age: string;
        ethnicity: string;
        clothing: string;
        expression: string;
        background: string;
    };
}
interface PromptTemplatesProps {
    onTemplateClick: (template: PromptTemplate) => void;
}
declare const PromptTemplates: ({ onTemplateClick }: PromptTemplatesProps) => import("react").JSX.Element;
export default PromptTemplates;
