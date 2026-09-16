/** Portrait screens keep neighbouring videos close to the central card.
 * Landscape desktop retains the original 58vh spacing and scroll response.
 */
export function rollStride(viewportHeight: number, cardHeight: number) {
  return Math.min(viewportHeight * 0.58, cardHeight + Math.max(64, viewportHeight * 0.04));
}
