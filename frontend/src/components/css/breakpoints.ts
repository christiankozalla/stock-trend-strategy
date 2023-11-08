export function mq({ min, max }: { min?: string, max?: string }) {
    const query = [min && `(min-width: ${min})`, max && `(max-width: ${max})`].filter(Boolean).join(" and ")
    return (styles: object): Record<string, any> => ({
        ["@media " + query]: styles
    });
}