/**
 * How strict the pixel comparison is — shared by the browser estimate and the
 * official server score so both agree. 0.1 is pixelmatch's default: colours
 * must be nearly identical; anti-aliased edge pixels are ignored.
 */
export const MATCH_THRESHOLD = 0.1;
