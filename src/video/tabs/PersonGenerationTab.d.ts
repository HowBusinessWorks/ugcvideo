import { PromptTemplate } from '../../landing-page/components/PromptTemplates';
interface PersonGenerationTabProps {
    template?: PromptTemplate;
    onTemplateUsed?: () => void;
}
export default function PersonGenerationTab({ template, onTemplateUsed }: PersonGenerationTabProps): import("react").JSX.Element;
export {};
