import statusCodes from './statusCodes';
import reasonPhrases from './reasonPhrases';

class ErrorResponse extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        
        // Set the prototype explicitly for proper instanceof checks
        Object.setPrototypeOf(this, ErrorResponse.prototype);
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor(message: string = reasonPhrases.CONFLICT, statusCode: number = statusCodes.FORBIDDEN) {
        super(message, statusCode);
        Object.setPrototypeOf(this, ConflictRequestError.prototype);
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message: string = reasonPhrases.CONFLICT, statusCode: number = statusCodes.FORBIDDEN) {
        super(message, statusCode);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
}

class BadUserRequestError extends ErrorResponse {
    constructor(message: string = reasonPhrases.UNAUTHORIZED, statusCode: number = statusCodes.UNAUTHORIZED) {
        super(message, statusCode);
        Object.setPrototypeOf(this, BadUserRequestError.prototype);
    }
}

class BadUser2RequestError extends ErrorResponse {
    constructor(message: string = reasonPhrases.FORBIDDEN, statusCode: number = statusCodes.FORBIDDEN) {
        super(message, statusCode);
        Object.setPrototypeOf(this, BadUser2RequestError.prototype);
    }
}

export {
    ConflictRequestError,
    BadRequestError,
    BadUserRequestError,
    BadUser2RequestError,
    ErrorResponse
};