import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const CHARACTER_SIZE = 60;
export const ENEMY_SIZE = 40;
export const BULLET_SIZE = 10;

export const styles = {
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  stars: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.3,
  },
  hud: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00000088',
    padding: 8,
    borderRadius: 10,
  },
  barBg: {
    width: 100,
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  scoreText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter_900Black',
  },
  xpBarContainer: {
    height: 20,
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  xpBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#3b82f6',
  },
  xpText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_900Black',
    textAlign: 'center',
  },
  gameField: {
    flex: 1,
  },
  character: {
    position: 'absolute',
    bottom: 120,
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
  },
  shipBody: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  thruster: {
    position: 'absolute',
    bottom: -15,
    width: 20,
    height: 20,
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    zIndex: -1,
  },
  bullet: {
    position: 'absolute',
    width: BULLET_SIZE,
    height: BULLET_SIZE * 2,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  enemy: {
    position: 'absolute',
    width: ENEMY_SIZE,
    height: ENEMY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyHpBg: {
    position: 'absolute',
    top: -10,
    width: ENEMY_SIZE,
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  enemyHpFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: width * 0.8,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 28,
    fontFamily: 'Inter_900Black',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
  },
  upgradeBtn: {
    width: '100%',
    padding: 15,
    backgroundColor: '#050505',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  scoreTotal: {
    color: '#3b82f6',
    fontSize: 24,
    fontFamily: 'Inter_900Black',
    marginBottom: 30,
  },
  exitBtn: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  exitText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_900Black',
  },
};
