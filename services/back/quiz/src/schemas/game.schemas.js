const createGameSessionSchema = {
	body: {
    type: 'object',
    properties: {
		mode: { 
			type: 'string', 
			enum: ['easy', 'medium', 'hard', 'random'],
			default: 'random'
		},
		topic: { 
			oneOf: [
				{ type: 'array', 
					items: { type: 'string' } },
				{ type: 'null' }
			],
		},
		question_count: { 
			type: 'integer', 
			minimum: 1, 
			maximum: 20,
			default: 2
		},
		max_players: { 
			type: 'integer', 
			minimum: 1, 
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

const GameSessionCode = 
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

const GameSessionAnswer = 
{
	params: { id: { type: 'integer' } },
	body: {
		type: 'object',
		required: ['question_id', 'answer'],
		properties: {
			question_id: { type: 'integer', minimum: 1 },
			answer: { 
			oneOf: [
				{ type: 'integer', minimum: 1, maximum: 4 },
				{ type: 'string', minLength: 1 }
			]
			},
		}
	}
}


module.exports = {
	createGameSessionSchema,
	GameSessionId,
	GameSessionCode,
	GameSessionAnswer
};
