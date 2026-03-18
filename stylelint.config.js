/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-standard'],
	rules: {
		'alpha-value-notation': 'number',
		'color-function-alias-notation': null,
		'color-function-notation': 'legacy',
		'color-hex-length': null,
		'comment-empty-line-before': null,
		'custom-property-pattern': '^(gantt|demo)-[a-z][a-z0-9-]*$',
		'declaration-empty-line-before': null,
		'declaration-no-important': null,
		'font-family-name-quotes': null,
		'media-feature-range-notation': null,
		'no-descending-specificity': [true, {ignore: ['selectors-within-list']}],
		'rule-empty-line-before': null,
		'selector-class-pattern': ['^(gantt|demo)-[a-zA-Z0-9_-]+$', {resolveNestedSelectors: true}],
		'selector-not-notation': 'simple',
	},
};
