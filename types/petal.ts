import { encode, Hash, yamlParse } from "../util/deps.ts";

import { Task } from "./task.ts";
import { getPetalData } from "../controllers/redis.controller.ts";
import { PetalStore } from "../models/petalStore.model.ts";
/**
 * Petal object, this is like the "program" or personality that the
 * chat bot can use to respond to messages. Each petal has a goal
 * that it is trying to achieve.
 *
 * @example
 * const petal = new Petal("petals/support.yaml");
 *
 * ```yaml
 * name: technical support bot
 * modelProvider: 'OpenAI'
 * modelName: 'gpt-3.5-turbo'
 * tasks:
 *  - goal: figure out the details of a user error
 *    controller: 'petals.support:sendToClickUp'
 *    objectives:
 *      - 'which page is the user on?'
 *      - 'what is the user trying to do?'
 * ```
 */
export class Petal {
  private fileName: string;
  private hash: string;
  private name: string;

  private modelProvider: string;
  private modelName: string;

  private tasks: Task[];

  constructor(
    fileName: string,
    hash: string,
    name: string,
    tasks: Task[],
    options?: { modelProvider: string; modelName: string },
  ) {
    this.fileName = fileName;
    this.hash = hash;
    this.name = name;

    this.modelProvider = options?.modelProvider ?? "";
    this.modelName = options?.modelName ?? "";

    this.tasks = tasks;
  }

  /**
   * @returns {string} The hash of the petal.
   */
  public getHash(): string {
    return this.hash;
  }

  /**
   * @returns {string} The name of the petal.
   */
  public getName(): string {
    return this.name;
  }

  /**
   * @returns {string} The file name of the petal.
   */
  public getFileName(): string {
    return this.fileName;
  }

  /**
   * @returns {string} The model provider of the petal.
   */
  public getModelProvider(): string {
    return this.modelProvider;
  }

  /**
   * @returns {string} The model name of the petal.
   */
  public getModelName(): string {
    return this.modelName;
  }

  /**
   * @returns {Task[]} The tasks of the petal.
   */
  public getTasks(): Task[] {
    return this.tasks;
  }

  /**
   * Loops through tasks and returns the first one where .isFinished is false.
   *
   * @returns {Task} The current task of the petal.
   */
  public getCurrentTask(): Task | void {
    for (const task of this.tasks) {
      if (!task.isFinished()) {
        return task;
      }
    }
  }

  /**
   * Updates the objective of the current task.
   *
   * @param objective {string} The objective to update.
   * @param value {string} The value to update the objective to.
   */
  public updateObjective(objective: string, value: string): void {
    const currentTask = this.getCurrentTask();

    console.log(currentTask?.getRequiredObjectives());

    if (currentTask === undefined) {
      throw new Error(
        "types/petal.ts - updateObjective - current task is undefined",
      );
    }

    currentTask.updateObjective(objective, value);
  }

  /**
   * If the chatbot collects any additional data it thinks is relevant it gets send here.
   *
   * @param objective {string} The objective to add additional data to.
   */
  public addAdditionalObejctive(objective: string, value: string): void {
    const currentTask = this.getCurrentTask();

    if (currentTask === undefined) {
      throw new Error(
        "types/petal.ts - addAdditionalObjective - current task is undefined",
      );
    }

    currentTask.addAdditionalObjective(objective, value);
  }
}

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
   * @param fileName {string} The name of the YAML file.
   * @returns {Promise<Petal>} A Petal object from a YAML file definition.
   */
  public static async fromYamlFile(fileName: string): Promise<Petal> {
    // Get the YAML file data
    const yamlFile = await Deno.readTextFile(fileName);
    const yaml = yamlParse(yamlFile);

    if (yaml === null) {
      throw new Error("types/petal.ts - fromYamlFile - YAML file is empty");
    }

    if (yaml.name === undefined) {
      throw new Error(
        "types/petal.ts - fromYamlFile - YAML file is missing name",
      );
    }

    // Hash the YAML file
    const hash = new Hash("md5").digest(encode(yamlFile)).hex();

    // Create tasks
    // TODO: Abstract this code out because I use it in fromRedis as well
    const tasks: Task[] = [];
    for (const task of yaml.tasks) {
      // Turn the list of objectives into a map
      const objectives: { [key: string]: string | null } = {};
      for (const objective of task.objectives) {
        objectives[objective] = null;
      }

      // Create the task
      tasks.push(new Task(task.goal, task.controller, objectives));
    }

    // Create a new Petal object
    return new Petal(fileName, hash, yaml.name, tasks, {
      modelProvider: yaml.modelProvider,
      modelName: yaml.modelName,
    });
  }

  /**
   * Takes the session ID and expands the truncated Petal object from Redis.
   *
   * In redis only the hash and the tasks are stored. This method will
   * get the full petal object from the PetalStore and return it.
   *
   * @param sessionId {string} The Socket.IO session ID
   * @returns {Promise<Petal | void>} A Petal object from Redis.
   */
  public static async fromRedis(sessionId: string): Promise<Petal | void> {
    const petal = await getPetalData(sessionId);

    if (!petal) {
      return;
    }

    // The petal from redis only has the hash and the tasks
    const petalObj = JSON.parse(petal);
    const petalHash = petalObj.hash;
    const petalTasks = petalObj.tasks;

    // Create tasks
    const tasks: Task[] = [];
    for (const task of petalTasks) {
      console.log(task);
      // Turn the list of objectives into a map
      const objectives = JSON.parse(task.objectives);

      // Create the task
      tasks.push(new Task(task.goal, task.controller, objectives));
    }

    console.log(`Found petal ${petalHash} in Redis`);
    // Get the full petal object
    const petalFull = await PetalStore.getPetal(petalHash);

    if (!petalFull) {
      throw new Error("types/petal.ts - fromRedis: Petal not found");
    }

    // Create a new Petal object
    return new Petal(
      petalFull.getFileName(),
      petalFull.getHash(),
      petalFull.getName(),
      tasks,
      {
        modelProvider: petalFull.getModelProvider(),
        modelName: petalFull.getModelName(),
      },
    );
  }

  /**
   * Creates an empty petal object.
   *
   * @returns {Petal} An empty petal object.
   */
  public static emptyPetal(): Petal {
    return new Petal("", "", "", []);
  }
}
