import rawModel from '../assets/rf_model.json';

export interface TreeData {
  f: number[];
  t: number[];
  l: number[];
  r: number[];
  v: number[];
}

export interface ModelData {
  meta: {
    algorithm: string;
    n_estimators: number;
    data_source: string;
    test_r2: number;
    test_mae_inr: number;
  };
  features: string[];
  options: Record<string, string[]>;
  trees: TreeData[];
}

export class RandomForest {
  readonly features: string[];
  readonly options: Record<string, string[]>;
  private readonly trees: TreeData[];

  constructor(data: ModelData) {
    this.features = data.features;
    this.options = data.options;
    this.trees = data.trees;
  }

  encode(selection: Record<string, string>, age: number): number[] {
    return this.features.map((name) => {
      if (name === 'age') {
        return age;
      }
      const opts = this.options[name];
      if (!opts) {
        throw new Error(`Unknown feature: ${name}`);
      }
      const idx = opts.indexOf(selection[name]);
      if (idx < 0) {
        throw new Error(`Invalid value for ${name}: ${selection[name]}`);
      }
      return idx;
    });
  }

  predict(x: number[]): number {
    let sum = 0.0;
    for (const tr of this.trees) {
      let n = 0;
      while (tr.f[n] >= 0) {
        n = x[tr.f[n]] <= tr.t[n] ? tr.l[n] : tr.r[n];
      }
      sum += tr.v[n];
    }
    return sum / this.trees.length;
  }

  static load(): RandomForest {
    return new RandomForest(rawModel as unknown as ModelData);
  }
}
