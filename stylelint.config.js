/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-standard'],
	rules: {
		'alpha-value-notation': 'number',
		'color-function-alias-notation': null,
		'color-function-notation': 'legacy',
		'color-hex-length': 'short',
		'comment-empty-line-before': null,
		'custom-property-pattern': '^(gantt|demo)-[a-z][a-z0-9-]*$',
		'declaration-empty-line-before': null,
		'declaration-no-important': null,
		'font-family-name-quotes': null,
		'media-feature-range-notation': 'context',
		'no-descending-specificity': [true, {ignore: ['selectors-within-list']}],
		'number-max-precision': 4,
		'rule-empty-line-before': null,
		'selector-class-pattern': ['^(gantt|demo)-[a-zA-Z0-9_-]+$', {resolveNestedSelectors: true}],
		'selector-not-notation': 'simple',
	},
};
