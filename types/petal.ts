import { encode, Hash, yamlParse } from "../util/deps.ts";

/**
 * Because the read file is async and constructors can't be async
 * we have to use a factory to create the petal object. The factory
 * can be intilized and then used to create petal objects from YAML.
 *
 * @example
 * const petalFactory = new PetalFactory();
 * const petal = await petalFactory.fromYamlFile("petals/bug_expresser.yaml");
 */
export class PetalFactory {
  constructor() {}

  /**
   * Takes a YAML file and turns it into a Petal object.
   *
   * The YAML file is hashed and the hash is stored in the Petal object
   * as the unique identifier for each petal.
   *
   * @param fileName
   * @returns
   */
  public async fromYamlFile(fileName: string): Promise<Petal> {
    // Get the YAML file data
    const yamlFile = await Deno.readTextFile(fileName);
    const yaml = yamlParse(yamlFile);

    if (yaml === null) {
      throw new Error("YAML file is empty");
    }

    if (yaml.name === undefined) {
      throw new Error("YAML file is missing name");
    }

    // Hash the YAML file
    const hash = new Hash("md5").digest(encode(yamlFile)).hex();
    console.log("Hash");
    console.log(hash);

    // Create a new Petal object
    return new Petal(fileName, hash, yaml.name);
  }
}

/**
 * Petal object, this is like the "program" or personality that the
 * chat bot can use to respond to messages. Each petal has a goal
 * that it is trying to achieve.
 */
export class Petal {
  private fileName: string;
  private hash: string;
  private name: string;

  constructor(fileName: string, hash: string, name: string) {
    this.fileName = fileName;
    this.hash = hash;
    this.name = name;
  }

  /**
   * @returns The hash of the petal.
   */
  public getHash(): string {
    return this.hash;
  }

  /**
   * @returns The name of the petal.
   */
  public getName(): string {
    return this.name;
  }

  /**
   * @returns The file name of the petal.
   */
  public getFileName(): string {
    return this.fileName;
  }
}
