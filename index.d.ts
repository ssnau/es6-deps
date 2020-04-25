interface DepOpts {
  ignoreBuiltin: boolean;
  supressNotFound: boolean;
  ignorePattern: RegExp;
}

// see: https://www.npmjs.com/package/resolve
interface ResolveOpts {
  basedir: string;
  package: Object;
  extensions: Array<string>;
}

interface AnalyzerOpt{
  resolve: ResolveOpts;
}

declare class Analyzer {
  constructor(opt?: AnalyzerOpt);

  clearCache: () => void;
  resolve: (name: string, opts: ResolveOpts) => string;
  getDeps: (str: string, content: string, opt: DepOpts) => Array<string>; 
}

export default Analyzer;
