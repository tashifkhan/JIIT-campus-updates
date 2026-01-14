// Stub types for minimatch - minimatch provides its own types but older dependencies may reference @types/minimatch
declare module 'minimatch' {
  function minimatch(target: string, pattern: string, options?: minimatch.IOptions): boolean;
  
  namespace minimatch {
    interface IOptions {
      debug?: boolean;
      nobrace?: boolean;
      noglobstar?: boolean;
      dot?: boolean;
      noext?: boolean;
      nocase?: boolean;
      nonull?: boolean;
      matchBase?: boolean;
      nocomment?: boolean;
      nonegate?: boolean;
      flipNegate?: boolean;
    }
    
    const sep: RegExp;
    function filter(pattern: string, options?: IOptions): (element: string, indexed: number, array: string[]) => boolean;
    function match(list: readonly string[], pattern: string, options?: IOptions): string[];
    function makeRe(pattern: string, options?: IOptions): RegExp | false;
    class Minimatch {
      constructor(pattern: string, options?: IOptions);
      match(fname: string): boolean;
    }
  }
  
  export = minimatch;
}
