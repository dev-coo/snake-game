import Phaser from 'phaser';

/**
 * 게임 에셋을 미리 로드하는 씬
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // 프로그레스 바 생성
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '로딩중...',
      style: {
        font: '20px monospace',
        color: '#ffffff',
      },
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // 로딩 이벤트 리스너
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
    
    // 에셋 로드 (현재는 코드로 그리므로 특별한 에셋 없음)
    // 추후 스프라이트나 사운드 추가 시 여기서 로드
    this.createAssets();
  }

  create() {
    this.scene.start('GameScene');
  }

  /**
   * 동적으로 게임 에셋 생성
   */
  private createAssets() {
    // 뱀 머리, 몸통, 먹이 등을 동적으로 생성
    // 현재는 단순 도형으로 표현
  }
}