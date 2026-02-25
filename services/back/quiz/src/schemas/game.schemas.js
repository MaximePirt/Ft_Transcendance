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
		},
		power_ups: 
		{
		type: 'array',
		items: { type: 'string' },
		default: []
		},
		is_solo: {
			type: 'integer',
			default: 0
		}
	},
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
	params: {
		type: 'object',
			properties: {
				id: {
					type: 'integer',
					minimum: 1
				}
			},
			required: ['id']
	},
	body: {
		type: 'object',
		properties: {
			question_id: { type: 'integer', minimum: 1 },
			answer: { 
			oneOf: [
				{ type: 'integer', minimum: 0 },
				{ type: 'string', minLength: 1 }
			]
			},
		required: ['question_id', 'answer'],
		}
	}
}


module.exports = {
	createGameSessionSchema,
	GameSessionId,
	GameSessionCode,
	GameSessionAnswer
};
