export class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
    Object.setPrototypeOf(this, ProjectError.prototype);
  }
}

export class ProjectConflictError extends ProjectError {
  constructor(key: string) {
    super(`Conflict: project key ${key} already exists`);
    this.name = 'ProjectConflictError';
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor() {
    super('Project not found');
    this.name = 'ProjectNotFoundError';
  }
}

export class ProjectPermissionError extends ProjectError {
  constructor(action: string) {
    super(`Permission denied to ${action} this project`);
    this.name = 'ProjectPermissionError';
  }
}

export class ProjectActorError extends ProjectError {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectActorError';
  }
}
