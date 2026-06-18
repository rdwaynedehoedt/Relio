declare module "vcf" {
  type VcfProperty = {
    _data?: string;
    clone: () => VcfProperty;
  };

  type VcfCard = {
    get: (key: string) => VcfProperty | VcfProperty[] | null | undefined;
    parse: (value: string) => VcfCard;
  };

  interface VcfModule {
    parse: (value: string) => VcfCard[];
  }

  const vcf: VcfModule;
  export default vcf;
}
