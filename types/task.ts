/**
 * Task object, this will define a goal of the petal.
 */
export class Task {
  // High level goal of the task.
  private goal: string;
  // The controller is the file that will be used to handle the task.
  private controller: string;
  // The objective object will be given to the controller. The constructor
  // gets an object with the key being the name of the piece of information
  // and the value being the value of the piece of information. See description
  // on getObjectivesObject for more information about how this is used.
  private objectives: { [key: string]: string | null } = {};

  constructor(
    goal: string,
    controller: string,
    objectives: { [key: string]: string | null },
  ) {
    // If you update the constructor, make sure to update toJSON()
    this.goal = goal;
    this.controller = controller;
    this.objectives = objectives;
  }

  /**
   * @returns {string} Get the goal of the task.
   */
  public getGoal(): string {
    return this.goal;
  }

  /**
   * Returns objective's key pair values collected by daisy.
   *
   * @returns {{ [key: string]: string | null }} An object with the keys of the objective and the values.
   *
   * @example
   * Suppose that the goal of the task is to collect information about the user,
   * such as name and age, then this object will be returned.
   *
   * {
   *  "name": "John",
   *  "age": "20"
   * }
   *
   * This information will be collected by the chatbot and then given to the
   * controller to use once getRequiredObjectives() returns an empty string.
   */
  public getObjectivesObject(): { [key: string]: string | null } {
    return this.objectives;
  }

  public getRequiredObjectives(): string {
    // Get objectives that are still null
    const requiredObjectives = Object.keys(this.objectives).filter(
      (key) => this.objectives[key] === null,
    );

    // Return the objectives as a string with new lines and dashes
    // - Objective 1
    // - Objective 2
    return requiredObjectives.join("\n- ");
  }

  /**
   * This is so that JSON.stringify() will work on the task object.
   *
   * The idea here is that the data in the task can be stored outside
   * of the program and then loaded in later. For instance storing the
   * task in a database such as redis.
   *
   * @returns A JSON object with the goal, controller, and objectives.
   */
  toJSON() {
    return {
      goal: this.goal,
      controller: this.controller,
      objectives: JSON.stringify(this.objectives),
    };
  }
}
