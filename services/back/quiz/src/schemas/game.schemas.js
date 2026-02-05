const createGameSessionSchema = {
	body: {
    type: 'object',
    properties: {
		mode: { 
			type: 'string', 
			enum: ['easy', 'medium', 'hard'],
			default: 'medium'
		},
		topic: {
			type: 'string',
			default: 'general'
		},
		question_count: { 
			type: 'integer', 
			minimum: 5, 
			maximum: 20,
			default: 10
		},
		max_players: { 
			type: 'integer', 
			minimum: 2, 
			maximum: 8,
			default: 4 
		}
    }
	}
};

const GameSessionId = {
	params: {
		type: 'object',
		properties: {
			id: {
				type: 'integer',
				minimum: 1,
			}
		},
		required: ['id']
	}
};

const JoinGameSessionSchema = 
{
	body: {
		type: 'object',
		properties: {
			code: {
				type: 'string',
				minLength: 6,
				maxLength: 6
			}
		},
		required: ['code']
	}
}


module.exports = {
	createGameSessionSchema,
	GameSessionId,
	JoinGameSessionSchema
};
